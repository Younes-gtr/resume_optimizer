import type { Project, ResumeResponse, SkillCategory, TaggedItem } from "../types/resume.types";
import { readJsonFile } from "./jsonFile";

const EXPECTED_KEYS: (keyof ResumeResponse)[] = [
  "summary", "education", "experiences", "projects", "skills", "languages", "interests",
];

export function validateResumeJson(data: unknown): data is ResumeResponse {
  if (typeof data !== "object" || data === null) return false;
  return EXPECTED_KEYS.every((k) => k in (data as object));
}

function isFlatSkillList(skills: unknown[]): skills is TaggedItem[] {
  return skills.length > 0 && skills.every((s) => typeof s === "object" && s !== null && "value" in s);
}

// Upgrades cv.json files saved by older versions of the app to the current format.
function normalizeResume(data: ResumeResponse): ResumeResponse {
  const rawSkills: unknown[] = data.skills;
  const skills: SkillCategory[] = isFlatSkillList(rawSkills)
    ? [{ category: "Skills", skills: rawSkills }]
    : data.skills;
  const projects: Project[] = data.projects.map((p) => ({ ...p, show_technologies: p.show_technologies ?? true }));
  return { ...data, skills, projects };
}

export async function readResumeJsonFile(file: File): Promise<ResumeResponse> {
  return normalizeResume(await readJsonFile(file, validateResumeJson));
}
