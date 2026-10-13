from fastapi import APIRouter, HTTPException, status

from app.schemas.llm_schema import LLMRequest, LLMResponse
from app.services import llm_service

router = APIRouter(prefix="/api/v1/llm", tags=["llm"])


@router.post("/generate", response_model=LLMResponse, status_code=status.HTTP_200_OK)
def generate(body: LLMRequest) -> LLMResponse:
    try:
        response_text = llm_service.generate(body.prompt)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    return LLMResponse(response=response_text)
