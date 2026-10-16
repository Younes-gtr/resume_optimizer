import type { PersonalInfo } from "../types/personalInfo.types";
import type { ResumeResponse } from "../types/resume.types";

export async function generateLatex(resume: ResumeResponse, personalInfo: PersonalInfo): Promise<void> {
  const res = await fetch("/api/v1/latex/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, personal_info: personalInfo }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cv.tex";
  a.click();
  URL.revokeObjectURL(url);
}
