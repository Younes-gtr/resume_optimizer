from pydantic import BaseModel

from app.schemas.personal_info_schema import PersonalInfo
from app.schemas.resume_schema import ResumeResponse


class LatexRequest(BaseModel):
    resume: ResumeResponse
    personal_info: PersonalInfo
