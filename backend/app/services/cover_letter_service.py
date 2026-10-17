import json
import re

from app.schemas.cover_letter_schema import CoverLetter, CoverLetterResponse
from app.schemas.resume_schema import ResumeResponse
from app.services import llm_service

_COVER_LETTER_PROMPT = """You write the body of a cover letter in English, tailored to one specific job offer.
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
1. Introduction: who the candidate is (current degree, school, program, from the CV), what they are looking for
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

STRICT RULES — never inventing anything is the most important rule:
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
If the CV does not contain enough material for a paragraph, write a shorter letter rather than an unsupported claim.

STEP 3 — Self-check before returning: re-read every sentence. Delete or rewrite any sentence containing a fact
about the candidate that is not in the CV JSON, or a statement about the offer that is not in the offer.

Return ONLY a valid JSON object, without markdown or code block:
{
  "offer_analysis": {
    "company_activity": "string",
    "key_missions": ["string"],
    "key_requirements": ["string"],
    "cv_evidence": ["requirement -> CV item"]
  },
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
