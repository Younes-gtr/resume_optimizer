from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import cover_letter, job_offer, latex, llm, resume

app = FastAPI(title="Resume Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm.router)
app.include_router(resume.router)
app.include_router(latex.router)
app.include_router(cover_letter.router)
app.include_router(job_offer.router)
