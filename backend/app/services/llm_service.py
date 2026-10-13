from groq import Groq

from app.config import get_settings


def generate(prompt: str) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)
    result = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
    )
    return result.choices[0].message.content
