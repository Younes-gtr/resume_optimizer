from pydantic import BaseModel


class PersonalInfo(BaseModel):
    """Identity and contact details. Used only to fill the LaTeX header — never sent to the LLM."""

    full_name: str
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
