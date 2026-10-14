import type { ResumeResponse } from "../types/resume.types";

const EXPECTED_KEYS: (keyof ResumeResponse)[] = [
  "summary", "education", "experiences", "projects", "skills", "languages", "interests",
];

export function validateResumeJson(data: unknown): data is ResumeResponse {
  if (typeof data !== "object" || data === null) return false;
  return EXPECTED_KEYS.every((k) => k in (data as object));
}

export async function readResumeJsonFile(file: File): Promise<ResumeResponse> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Fichier JSON invalide.");
  }
  if (!validateResumeJson(parsed)) {
    throw new Error("Le JSON ne correspond pas au format attendu.");
  }
  return parsed;
}
