from fastapi import APIRouter, HTTPException, status

from app.schemas.resume_schema import AdaptRequest, ResumeRequest, ResumeResponse
from app.services import resume_service

router = APIRouter(prefix="/api/v1/resume", tags=["resume"])


@router.post("/parse", response_model=ResumeResponse, status_code=status.HTTP_200_OK)
def parse_resume(body: ResumeRequest) -> ResumeResponse:
    try:
        return resume_service.parse_resume(body.cv_text)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/adapt", response_model=ResumeResponse, status_code=status.HTTP_200_OK)
def adapt_resume(body: AdaptRequest) -> ResumeResponse:
    try:
        return resume_service.adapt_resume(body.resume, body.job_offer)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
