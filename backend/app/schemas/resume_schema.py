from pydantic import BaseModel


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
    required: bool = False


class Language(BaseModel):
    language: str
    level: str | None = None
    required: bool = False


class PersonalInfo(BaseModel):
    full_name: str = "Prénom Nom"
    email: str = "prenom.nom@email.com"
    phone: str = "+33 6 00 00 00 00"
    location: str = "Ville, Pays"
    linkedin: str | None = None


class ResumeResponse(BaseModel):
    summary: str
    education: list[Education]
    experiences: list[Experience]
    projects: list[Project]
    skills: list[TaggedItem]
    languages: list[Language]
    interests: list[TaggedItem]


class AdaptRequest(BaseModel):
    resume: ResumeResponse
    job_offer: str
