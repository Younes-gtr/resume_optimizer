from fastapi import APIRouter, HTTPException, status

from app.schemas.job_offer_schema import JobOfferRequest, JobOfferResponse
from app.services import job_offer_service

router = APIRouter(prefix="/api/v1/job-offer", tags=["job-offer"])

@router.post("/extract", response_model=JobOfferResponse, status_code=status.HTTP_200_OK)
def extract_job_offer(body: JobOfferRequest) -> JobOfferResponse:
    try:
        extracted_job_offer = job_offer_service.extract_job_offer(body.job_offer)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    return JobOfferResponse(job_offer=extracted_job_offer)
