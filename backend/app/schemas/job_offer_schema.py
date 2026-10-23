from pydantic import BaseModel

class JobOfferRequest(BaseModel):
    job_offer: str

class JobOfferResponse(BaseModel):
    job_offer: str
