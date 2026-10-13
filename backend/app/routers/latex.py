from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel

from app.schemas.resume_schema import PersonalInfo, ResumeResponse
from app.services import latex_service

router = APIRouter(prefix="/api/v1/latex", tags=["latex"])


class LatexRequest(BaseModel):
    resume: ResumeResponse
    personal_info: PersonalInfo | None = None


@router.post("/generate", status_code=status.HTTP_200_OK)
def generate_latex(body: LatexRequest) -> Response:
    try:
        tex_content = latex_service.generate_latex(body.resume, body.personal_info)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return Response(
        content=tex_content.encode("utf-8"),
        media_type="application/x-tex",
        headers={"Content-Disposition": "attachment; filename=cv.tex"},
    )
