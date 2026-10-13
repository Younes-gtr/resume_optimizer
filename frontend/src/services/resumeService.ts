import type { AdaptRequest, ResumeRequest, ResumeResponse } from "../types/resume.types";

export async function parseResume(cvText: string): Promise<ResumeResponse> {
  const body: ResumeRequest = { cv_text: cvText };
  const res = await fetch("/api/v1/resume/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  return res.json() as Promise<ResumeResponse>;
}

export async function adaptResume(resume: ResumeResponse, jobOffer: string): Promise<ResumeResponse> {
  const body: AdaptRequest = { resume, job_offer: jobOffer };
  const res = await fetch("/api/v1/resume/adapt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  return res.json() as Promise<ResumeResponse>;
}
