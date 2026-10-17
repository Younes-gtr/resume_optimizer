import json
from typing import Any

from groq import Groq

from app.config import get_settings


def generate(prompt: str, temperature: float | None = None) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)
    result = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=temperature,
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
