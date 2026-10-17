import json
import re

from app.schemas.cover_letter_schema import CoverLetter, CoverLetterResponse
from app.schemas.resume_schema import ResumeResponse
from app.services import llm_service

_COVER_LETTER_PROMPT = """You write the body of a cover letter in English for a job application.
You receive the candidate's CV as JSON and a job offer.

STRICT RULES — never inventing anything is the most important rule:
1. Every fact about the candidate (experience, project, skill, degree, language, achievement, number, date, tool) MUST come from the CV JSON. If it is not in the CV JSON, do not write it.
2. Never invent numbers, metrics, durations, results, company names or technologies. Do not round or estimate.
3. Never claim a skill or experience just because the job offer asks for it. If a requirement of the offer is not covered by the CV, do not mention it.
4. Only rephrase what the CV says. Do not add details about how something was done, about the content of a degree, course or project, or about its quality, scale or impact (e.g. "reliable", "scalable", "rigorous training", "production environment") unless the CV states it.
5. Facts about the company or the position may only come from the job offer. Do not use outside knowledge about the company.
6. Do not use placeholders such as [Company] or [Your Name].
7. Do not write the greeting ("Dear ..."), the closing ("Sincerely, ..."), the candidate's name, contact details or the date: they are added separately.
8. Write 3 to 4 paragraphs, 250 to 350 words in total, in a professional and concise tone:
   - the position applied for and why it matches the candidate's background,
   - the most relevant experiences, projects and skills from the CV, linked to the needs of the offer,
   - a short conclusion asking for an interview.
   A shorter letter is always better than a letter containing a single unsupported claim.

Return ONLY a valid JSON object, without markdown or code block:
{
  "company": "company name as written in the job offer, or null if not stated",
  "company_location": "location of the company or position as written in the job offer, or null",
  "job_title": "position title as written in the job offer, or null",
  "recipient": "name of the hiring manager or contact person if explicitly given in the job offer, or null",
  "paragraphs": ["paragraph 1", "paragraph 2", "..."]
}"""

_NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def _check_letter(letter: CoverLetter, source_text: str) -> list[str]:
    """Cheap deterministic guards against hallucinations. Not exhaustive: the user must still proofread."""
    warnings: list[str] = []
    body = "\n".join(letter.paragraphs)

    unknown_numbers = sorted({n for n in _NUMBER.findall(body) if n not in source_text})
    if unknown_numbers:
        warnings.append(
            "Nombres absents du CV et de l'offre (possible invention) : " + ", ".join(unknown_numbers)
        )
    if "[" in body or "]" in body:
        warnings.append("La lettre contient des crochets : vérifiez qu'il ne reste pas de champ à compléter.")
    if not letter.paragraphs:
        warnings.append("La lettre générée est vide.")
    return warnings


def generate_cover_letter(resume: ResumeResponse, job_offer: str) -> CoverLetterResponse:
    resume_json = json.dumps(
        resume.model_dump(exclude={"projects": {"__all__": {"show_technologies"}}}),
        ensure_ascii=False,
        indent=2,
    )
    prompt = f"{_COVER_LETTER_PROMPT}\n\nCV JSON:\n{resume_json}\n\nJob offer:\n{job_offer}"
    # Low temperature: we want a faithful letter, not a creative one.
    data = llm_service.generate_json(prompt, temperature=0.2)
    letter = CoverLetter.model_validate(data)
    return CoverLetterResponse(letter=letter, warnings=_check_letter(letter, resume_json + "\n" + job_offer))
