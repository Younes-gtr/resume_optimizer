from pydantic import BaseModel

from app.schemas.personal_info_schema import PersonalInfo
from app.schemas.resume_schema import ResumeResponse


class CoverLetterRequest(BaseModel):
    resume: ResumeResponse
    job_offer: str


class CoverLetter(BaseModel):
    """Letter content written by the LLM. Personal info is never part of it: it is added when rendering."""

    company: str | None = None
    company_location: str | None = None
    job_title: str | None = None
    recipient: str | None = None
    paragraphs: list[str]


class CoverLetterResponse(BaseModel):
    letter: CoverLetter
    warnings: list[str]


class CoverLetterRevisionRequest(BaseModel):
    resume: ResumeResponse
    job_offer: str
    letter: CoverLetter
    feedback: str


class CoverLetterPdfRequest(BaseModel):
    letter: CoverLetter
    personal_info: PersonalInfo
