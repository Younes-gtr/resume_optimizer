import json
from typing import Any, TypeVar

from groq import Groq
from pydantic import BaseModel, ValidationError

from app.config import get_settings


T = TypeVar("T", bound=BaseModel)


def generate(prompt: str, temperature: float | None = None, response_format: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)
    result = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=temperature,
        response_format=response_format,
    )
    return result.choices[0].message.content


def generate_json(prompt: str, temperature: float | None = None) -> Any:
    """Calls the LLM and parses its answer as JSON, tolerating a surrounding ```json code block."""
    cleaned = generate(prompt, temperature).strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Le modèle n'a pas retourné un JSON valide : {e}") from e


def _strict_schema(node: Any) -> Any:
    """Adapts a Pydantic JSON schema to Groq's strict mode: every object closed, every field required, no defaults."""
    if isinstance(node, list):
        return [_strict_schema(v) for v in node]
    if not isinstance(node, dict):
        return node
    strict: dict[str, Any] = {}
    for key, value in node.items():
        if key in ("default", "title"):
            continue
        if key in ("properties", "$defs"):
            # Keys of these maps are field / model names (a field may be called "title"): keep them all.
            strict[key] = {name: _strict_schema(sub) for name, sub in value.items()}
        else:
            strict[key] = _strict_schema(value)
    if strict.get("type") == "object" and "properties" in strict:
        strict["additionalProperties"] = False
        strict["required"] = list(strict["properties"])
    return strict


def generate_structured(prompt: str, schema: type[T], temperature: float | None = None) -> T:
    """Calls the LLM with a strict JSON schema: the answer is constrained to the structure of `schema`.

    The schema guarantees the structure only, not the faithfulness of the content.
    """
    response_format = {
        "type": "json_schema",
        "json_schema": {"name": schema.__name__, "schema": _strict_schema(schema.model_json_schema()), "strict": True},
    }
    raw = generate(prompt, temperature, response_format)
    try:
        return schema.model_validate_json(raw)
    except ValidationError as e:
        raise ValueError(f"La réponse du modèle ne respecte pas le format attendu : {e}") from e
