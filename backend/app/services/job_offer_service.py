from langchain.messages import HumanMessage

from app.agents.graph import agent


def extract_job_offer(user_input: str) -> str:
    if not user_input.strip():
        raise ValueError("Collez le texte ou l'URL de l'offre.")
    result = agent.invoke(
        {"messages": [HumanMessage(content=user_input)], "llm_calls": 0},
        config={"recursion_limit": 8},  # stops a tool-calling loop that never ends
    )
    text = result["messages"][-1].text.strip()
    if not text or "NO_JOB_OFFER_FOUND" in text:
        raise ValueError("Impossible d'extraire une offre : collez directement le texte de l'offre.")
    return text
