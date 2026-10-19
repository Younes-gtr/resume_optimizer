import type {
  CoverLetter,
  CoverLetterPdfRequest,
  CoverLetterRequest,
  CoverLetterResponse,
  CoverLetterRevisionRequest,
} from "../types/coverLetter.types";
import type { PersonalInfo } from "../types/personalInfo.types";
import type { ResumeResponse } from "../types/resume.types";

async function postJson(url: string, body: unknown): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  return res;
}

// Only the resume and the job offer are sent: personal info never reaches the LLM.
export async function generateCoverLetter(resume: ResumeResponse, jobOffer: string): Promise<CoverLetterResponse> {
  const body: CoverLetterRequest = { resume, job_offer: jobOffer };
  const res = await postJson("/api/v1/cover-letter/generate", body);
  return res.json() as Promise<CoverLetterResponse>;
}

export async function reviseCoverLetter(
  resume: ResumeResponse,
  jobOffer: string,
  letter: CoverLetter,
  feedback: string,
): Promise<CoverLetterResponse> {
  const body: CoverLetterRevisionRequest = { resume, job_offer: jobOffer, letter, feedback };
  const res = await postJson("/api/v1/cover-letter/revise", body);
  return res.json() as Promise<CoverLetterResponse>;
}

export async function downloadCoverLetterPdf(letter: CoverLetter, personalInfo: PersonalInfo): Promise<void> {
  const body: CoverLetterPdfRequest = { letter, personal_info: personalInfo };
  const res = await postJson("/api/v1/cover-letter/pdf", body);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "cover_letter.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
