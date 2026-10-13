import json

from app.schemas.resume_schema import ResumeResponse
from app.services import llm_service

_SYSTEM_PROMPT = """You are a CV parser. The user will provide a resume in any format (plain text, LaTeX, etc.).
Your task is to extract all information and return it as a single valid JSON object.
Do not include any explanation, markdown, or code block. Return ONLY the raw JSON.

The JSON must follow this exact structure:
{
  "summary": "A short professional summary. If none is present, write one based on the CV content.",
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "start_date": "string",
      "end_date": "string or null",
      "required": false
    }
  ],
  "experiences": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "start_date": "string",
      "end_date": "string or null",
      "current": true or false,
      "description": ["string"],
      "required": false
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null",
      "required": false
    }
  ],
  "skills": [{ "value": "string", "required": false }],
  "languages": [
    {
      "language": "string",
      "level": "string or null",
      "required": false
    }
  ],
  "interests": [{ "value": "string", "required": false }]
}"""


def parse_resume(cv_text: str) -> ResumeResponse:
    prompt = f"{_SYSTEM_PROMPT}\n\nHere is the CV to parse:\n\n{cv_text}"
    raw = llm_service.generate(prompt)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Le modèle n'a pas retourné un JSON valide : {e}") from e

    return ResumeResponse.model_validate(data)


_ADAPT_SYSTEM_PROMPT = """You are a CV adapter. Your task is to filter and adapt a structured CV JSON to make it relevant for a specific job offer.

STRICT RULES — you must follow all of them without exception:
1. Return ONLY a valid JSON object with the exact same structure as the input. No explanation, no markdown, no code block.
2. DO NOT invent, add, or modify any content. Every item in the output must come verbatim from the input JSON.
3. Items where "required": true MUST always be included in the output. You may never omit them.
4. For items where "required": false, include only those most relevant to the job offer. You may omit the rest.
5. For "description" arrays within experiences, you may keep only the most relevant bullet points — but only those already present in the input. Never rewrite or combine them.
6. The "summary" field is the only text you may rewrite, but only to emphasize aspects already present in the input. Do not invent new facts or qualifications.
7. Preserve the "required" field value on every item exactly as it is in the input.
8. The output JSON must use the exact same field names and structure as the input."""


def adapt_resume(resume: ResumeResponse, job_offer: str) -> ResumeResponse:
    resume_json = json.dumps(resume.model_dump(), ensure_ascii=False, indent=2)
    prompt = (
        f"{_ADAPT_SYSTEM_PROMPT}\n\n"
        f"Input CV JSON:\n{resume_json}\n\n"
        f"Job offer:\n{job_offer}"
    )
    raw = llm_service.generate(prompt)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Le modèle n'a pas retourné un JSON valide : {e}") from e

    return ResumeResponse.model_validate(data)
