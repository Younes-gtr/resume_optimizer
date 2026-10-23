import type { JobOfferRequest, JobOfferResponse } from "../types/jobOffer.types";

// Runs the LangGraph agent: scrapes the page if given a URL, and returns the cleaned job offer text.
export async function extractJobOffer(input: string): Promise<string> {
  const body: JobOfferRequest = { job_offer: input };
  const res = await fetch("/api/v1/job-offer/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  const data = (await res.json()) as JobOfferResponse;
  return data.job_offer;
}
