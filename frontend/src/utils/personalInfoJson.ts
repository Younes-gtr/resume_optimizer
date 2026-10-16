import type { PersonalInfo } from "../types/personalInfo.types";
import { readJsonFile } from "./jsonFile";

const OPTIONAL_KEYS = ["email", "phone", "location", "linkedin"] as const;

function isPersonalInfoJson(data: unknown): data is PersonalInfo {
  if (typeof data !== "object" || data === null) return false;
  const record = data as Record<string, unknown>;
  if (typeof record.full_name !== "string" || !record.full_name.trim()) return false;
  return OPTIONAL_KEYS.every((k) => record[k] == null || typeof record[k] === "string");
}

export async function readPersonalInfoJsonFile(file: File): Promise<PersonalInfo> {
  const data = await readJsonFile(file, isPersonalInfoJson);
  return {
    full_name: data.full_name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    location: data.location ?? null,
    linkedin: data.linkedin ?? null,
  };
}
