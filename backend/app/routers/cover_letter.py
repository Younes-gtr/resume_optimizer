from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response

from app.schemas.cover_letter_schema import CoverLetterPdfRequest, CoverLetterRequest, CoverLetterResponse
from app.services import cover_letter_pdf_service, cover_letter_service

router = APIRouter(prefix="/api/v1/cover-letter", tags=["cover-letter"])


@router.post("/generate", response_model=CoverLetterResponse, status_code=status.HTTP_200_OK)
def generate_cover_letter(body: CoverLetterRequest) -> CoverLetterResponse:
    try:
        return cover_letter_service.generate_cover_letter(body.resume, body.job_offer)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@router.post("/pdf", status_code=status.HTTP_200_OK)
def cover_letter_pdf(body: CoverLetterPdfRequest) -> Response:
    try:
        pdf = cover_letter_pdf_service.render_cover_letter_pdf(body.letter, body.personal_info)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=cover_letter.pdf"},
    )
