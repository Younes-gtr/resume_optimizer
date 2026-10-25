import json
from typing import Any, TypeVar

from groq import BadRequestError, Groq
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


def _failed_generation(error: BadRequestError) -> str | None:
    """Groq rejects an answer that does not match the schema, but returns it in `failed_generation`."""
    body = error.body if isinstance(error.body, dict) else {}
    details = body.get("error", body)
    failed = details.get("failed_generation") if isinstance(details, dict) else None
    return failed if isinstance(failed, str) else None


def _unstringify_objects(node: Any) -> Any:
    """Repairs a known model mistake: list items written as a JSON string ("{...}") instead of an object."""
    if isinstance(node, dict):
        return {key: _unstringify_objects(value) for key, value in node.items()}
    if isinstance(node, list):
        repaired: list[Any] = []
        for item in node:
            if isinstance(item, str) and item.lstrip().startswith("{"):
                try:
                    item = json.loads(item)
                except json.JSONDecodeError:
                    pass
            repaired.append(_unstringify_objects(item))
        return repaired
    return node


def generate_structured(prompt: str, schema: type[T], temperature: float | None = None, attempts: int = 2) -> T:
    """Calls the LLM with a strict JSON schema and returns the answer validated by `schema`.

    Groq checks the answer against the schema after generation and rejects it if it does not match: the rejected
    answer is then repaired when possible, otherwise the call is retried.
    The schema guarantees the structure only, not the faithfulness of the content.
    """
    response_format = {
        "type": "json_schema",
        "json_schema": {"name": schema.__name__, "schema": _strict_schema(schema.model_json_schema()), "strict": True},
    }
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            raw = generate(prompt, temperature, response_format)
        except BadRequestError as e:
            failed = _failed_generation(e)
            if failed is None:
                raise
            raw = failed
        try:
            return schema.model_validate(_unstringify_objects(json.loads(raw)))
        except (json.JSONDecodeError, ValidationError) as e:
            last_error = e
    raise ValueError(f"La réponse du modèle ne respecte pas le format attendu : {last_error}") from last_error
