import json
import re
from datetime import date
from typing import Any, Literal

from app.schemas.cover_letter_schema import CoverLetter, CoverLetterResponse
from app.schemas.resume_schema import ResumeResponse
from app.services import llm_service

_WRITING_INSTRUCTIONS = """You write the body of a cover letter in English, tailored to one specific job offer.
You receive the candidate's CV as JSON and the job offer.

A good letter is specific: it names the company and its activity, picks up the missions and requirements of the offer
in the offer's own words, and answers each of them with precise evidence from the CV (school, degree, course,
company, project name, technologies). A generic letter that could be sent to any company is a bad letter.

STEP 1 — Analyse before writing (fill "offer_analysis"):
- company_activity: what the company does / works on, as described in the offer.
- key_missions: the 2 to 4 main tasks of the position, as described in the offer.
- key_requirements: the main skills or profile asked for in the offer.
- cv_evidence: for each mission or requirement covered by the CV, the exact CV item that proves it
  (e.g. "object detection -> ACME Robotics internship: Trained PyTorch object detection models").
  Requirements with no evidence in the CV are left out: they must not appear in the letter.

STEP 2 — Write 4 to 6 paragraphs, 250 to 400 words in total (fewer if the CV is short), following this structure:
1. Introduction: who the candidate is (degree, school, program, from the CV — see the tense rule), what they are looking for
   (the position from the offer; duration or start date only if written in the CV or the offer), and why this
   company: refer to its activity in the offer's words.
2. Academic background: the degrees, fields and courses named in the CV that relate to the offer's domain, and
   the offer's topics they connect to. Name them; do not describe what they teach.
3. Most relevant experience: the CV experience that best matches the key missions — company, role and what the
   candidate did, as written in the CV — explicitly linked to the missions of the offer.
4. Other relevant evidence: projects and skills from the CV that match the remaining requirements (name the
   projects and technologies).
5. Motivation: what attracts the candidate in the missions and domain of the offer, and what they would like to
   contribute to. This paragraph may express interest and enthusiasm, but only about elements written in the offer.
6. Closing: thank the reader, express availability for an interview.
Tone: professional, confident and warm; varied sentences; no clichés such as "I am the perfect candidate".
"""

_STRICT_RULES = """STRICT RULES — never inventing anything is the most important rule:
1. Every fact about the candidate (experience, project, course, skill, degree, language, achievement, number, date,
   tool) MUST come from the CV JSON. If it is not in the CV JSON, do not write it.
2. Never invent numbers, metrics, durations, results, publications, company names or technologies.
3. Never claim a skill or experience just because the offer asks for it.
4. Do not add details about how something was done, the content of a course or project, or its quality, scale or
   impact (e.g. "robust", "scalable", "rigorous training", "in production", "low latency", "fine-tuned") unless
   the CV states it.
   Do not state what an experience or project "required", "taught", "demonstrates" or "proves", and do not grade
   the candidate's level ("extensive", "strong", "deep expertise", "proficient") unless the CV says so.
   To link the CV to the offer, state the CV fact, then the mission of the offer it relates to — nothing more.
5. Facts about the company or the position may only come from the job offer, and statements about the offer must be
   true (e.g. only say a skill is asked for if the offer asks for it). Do not use outside knowledge.
6. Personal qualities (e.g. curious, adaptable) may only be used if they appear in the CV.
7. Do not use placeholders such as [Company] or [Your Name], and never mention "the CV", "my resume" or "the offer"
   in the letter itself.
8. Do not write the subject line, the greeting ("Dear ..."), the closing ("Sincerely, ..."), the candidate's name,
   contact details or the date: they are added separately.
9. Tense — today's date is given below the instructions. Each education item has a "status" computed from its end date:
   - "completed": past tense ("I graduated from X with a Y", "I hold a Y from X"). Never write that the candidate is
     completing, pursuing or currently studying for it.
   - "in progress": present tense ("I am currently pursuing a Y at X").
   - "unknown": neutral wording without tense ("my Y from X").
   This status overrides the wording of the summary: if the summary says "student" but every degree is completed,
   present the candidate as a graduate. Experiences with "current": false are described in the past tense.
If the CV does not contain enough material for a paragraph, write a shorter letter rather than an unsupported claim.

STEP 3 — Self-check before returning: re-read every sentence and check the tense of each degree. Delete or rewrite
any sentence containing a fact about the candidate that is not in the CV JSON, or a statement about the offer that
is not in the offer.
"""

_LETTER_FIELDS = """  "company": "company name as written in the job offer, or null if not stated",
  "company_location": "location of the company or position as written in the job offer, or null",
  "job_title": "position title as written in the job offer, or null",
  "recipient": "name of the hiring manager or contact person if explicitly given in the job offer, or null",
  "paragraphs": ["paragraph 1", "paragraph 2", "..."]"""

_GENERATION_PROMPT = f"""{_WRITING_INSTRUCTIONS}
{_STRICT_RULES}
Return ONLY a valid JSON object, without markdown or code block:
{{
  "offer_analysis": {{
    "company_activity": "string",
    "key_missions": ["string"],
    "key_requirements": ["string"],
    "cv_evidence": ["requirement -> CV item"]
  }},
{_LETTER_FIELDS}
}}"""

_REVISION_PROMPT = f"""You revise a cover letter written in English for a job application, following the candidate's feedback.
You receive the candidate's CV as JSON, the job offer, the current letter as JSON and the candidate's feedback.

1. Apply the feedback precisely. Change only what the feedback asks for, or what is needed to apply it: keep the
   rest of the letter as it is (the candidate may already have edited it by hand).
2. The candidate is the author of the feedback: facts it states about the candidate may be used like facts from
   the CV. Everything else must still follow the rules below.
3. Keep the letter body only: no subject line, greeting, closing, name or contact details.

{_STRICT_RULES}
Return ONLY the full revised letter as a valid JSON object, without markdown or code block:
{{
{_LETTER_FIELDS}
}}"""

_NUMBER = re.compile(r"\d+(?:[.,]\d+)?")
_YEAR = re.compile(r"\b(?:19|20)\d{2}\b")
_NUMERIC_MONTH = re.compile(r"\b(0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}\b")
# English and French month prefixes, in calendar order.
_MONTHS = [
    ("jan",), ("feb", "fév", "fev"), ("mar",), ("apr", "avr"), ("may", "mai"), ("jun", "juin"),
    ("jul", "juil"), ("aug", "aoû", "aou"), ("sep",), ("oct",), ("nov",), ("dec", "déc"),
]
_ONGOING_WORDS = ("present", "current", "ongoing", "now", "today", "présent", "en cours", "aujourd'hui")

EducationStatus = Literal["completed", "in progress", "unknown"]


def _month(text: str) -> int | None:
    numeric = _NUMERIC_MONTH.search(text)
    if numeric:
        return int(numeric.group(1))
    for index, prefixes in enumerate(_MONTHS, start=1):
        if any(re.search(rf"\b{p}", text) for p in prefixes):
            return index
    return None


def education_status(end_date: str | None, today: date) -> EducationStatus:
    """Whether a degree is finished, from its free-text end date ("2025", "Sep 2025", "09/2025", "Present"...)."""
    if not end_date:
        return "unknown"
    text = end_date.lower()
    if any(re.search(rf"\b{word}\b", text) for word in _ONGOING_WORDS):
        return "in progress"
    years = _YEAR.findall(text)
    if not years:
        return "unknown"
    year = int(years[-1])
    if year != today.year:
        return "completed" if year < today.year else "in progress"
    month = _month(text)
    if month is None:
        return "unknown"
    return "completed" if month <= today.month else "in progress"


def _resume_json(resume: ResumeResponse, today: date) -> str:
    data: dict[str, Any] = resume.model_dump(exclude={"projects": {"__all__": {"show_technologies"}}})
    for education in data["education"]:
        education["status"] = education_status(education["end_date"], today)
    return json.dumps(data, ensure_ascii=False, indent=2)


def _today_line(today: date) -> str:
    return f"Today's date: {today:%B} {today.day}, {today.year}"


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
    today = date.today()
    resume_json = _resume_json(resume, today)
    prompt = f"{_GENERATION_PROMPT}\n\n{_today_line(today)}\n\nCV JSON:\n{resume_json}\n\nJob offer:\n{job_offer}"
    # Low temperature: we want a faithful letter, not a creative one.
    # A letter uses ~1,500 output tokens including reasoning: 3,000 leaves room without over-reserving the rate limit.
    letter = CoverLetter.model_validate(llm_service.generate_json(prompt, temperature=0.2, max_tokens=3000))
    return CoverLetterResponse(letter=letter, warnings=_check_letter(letter, resume_json + "\n" + job_offer))


def revise_cover_letter(
    resume: ResumeResponse, job_offer: str, letter: CoverLetter, feedback: str
) -> CoverLetterResponse:
    today = date.today()
    resume_json = _resume_json(resume, today)
    letter_json = json.dumps(letter.model_dump(), ensure_ascii=False, indent=2)
    prompt = (
        f"{_REVISION_PROMPT}\n\n{_today_line(today)}\n\nCV JSON:\n{resume_json}\n\nJob offer:\n{job_offer}"
        f"\n\nCurrent letter:\n{letter_json}\n\nCandidate's feedback:\n{feedback}"
    )
    revised = CoverLetter.model_validate(llm_service.generate_json(prompt, temperature=0.2, max_tokens=3000))
    # Facts given in the feedback (or already in the edited letter) are legitimate sources too.
    source_text = "\n".join([resume_json, job_offer, feedback, letter_json])
    return CoverLetterResponse(letter=revised, warnings=_check_letter(revised, source_text))
