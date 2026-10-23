import requests
from bs4 import BeautifulSoup
from langchain.tools import tool

from app.agents.llm import get_chat_model


@tool
def scrap_site(url: str) -> str:
    """Scrap a website and return its text content.

    Args:
        url: The URL of the website to scrap.
    """
    try:
        response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
    except requests.RequestException as e:
        return f"Could not fetch {url}: {e}"
    text = BeautifulSoup(response.text, "html.parser").get_text(separator="\n", strip=True)
    return text[:15000]  # keep the context small: job pages are full of menus and footers


tools = [scrap_site]
tools_by_name = {t.name: t for t in tools}
model_with_tools = get_chat_model().bind_tools(tools)
