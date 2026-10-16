from typing import Any

from pydantic import BaseModel, field_validator


class ResumeRequest(BaseModel):
    cv_text: str


class TaggedItem(BaseModel):
    value: str
    required: bool = False


class Experience(BaseModel):
    company: str
    title: str
    location: str | None = None
    start_date: str
    end_date: str | None = None
    current: bool
    description: list[str]
    required: bool = False


class Education(BaseModel):
    institution: str
    degree: str
    field: str | None = None
    start_date: str
    end_date: str | None = None
    required: bool = False


class Project(BaseModel):
    name: str
    description: str
    technologies: list[str]
    url: str | None = None
    show_technologies: bool = True
    required: bool = False


class SkillCategory(BaseModel):
    category: str
    skills: list[TaggedItem]


class Language(BaseModel):
    language: str
    level: str | None = None
    required: bool = False


class ResumeResponse(BaseModel):
    summary: str
    education: list[Education]
    experiences: list[Experience]
    projects: list[Project]
    skills: list[SkillCategory]
    languages: list[Language]
    interests: list[TaggedItem]

    @field_validator("skills", mode="before")
    @classmethod
    def _wrap_flat_skills(cls, value: Any) -> Any:
        # Older cv.json files store skills as a flat list of TaggedItem: put them in a single category.
        if isinstance(value, list) and value and all(isinstance(v, dict) and "value" in v for v in value):
            return [{"category": "Skills", "skills": value}]
        return value


class AdaptRequest(BaseModel):
    resume: ResumeResponse
    job_offer: str
