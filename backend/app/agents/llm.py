from functools import lru_cache

from langchain_groq import ChatGroq

from app.config import get_settings
from app.services.llm_service import supports_reasoning_effort


@lru_cache
def get_chat_model() -> ChatGroq:
    settings = get_settings()
    return ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0,
        # Extracting the offer is mechanical: keep the reasoning short and the reserved output bounded,
        # otherwise each call eats most of the per-minute token budget (see llm_service.generate).
        max_tokens=3000,
        reasoning_effort="low" if supports_reasoning_effort(settings.groq_model) else None,
    )
