import type { PersonalInfo } from "./personalInfo.types";
import type { ResumeResponse } from "./resume.types";

// Letter content written by the LLM. Personal info is never part of it: it is added when rendering.
export interface CoverLetter {
  company: string | null;
  company_location: string | null;
  job_title: string | null;
  recipient: string | null;
  paragraphs: string[];
}

export interface CoverLetterRequest {
  resume: ResumeResponse;
  job_offer: string;
}

export interface CoverLetterResponse {
  letter: CoverLetter;
  warnings: string[];
}

export interface CoverLetterRevisionRequest {
  resume: ResumeResponse;
  job_offer: string;
  letter: CoverLetter;
  feedback: string;
}

export interface CoverLetterPdfRequest {
  letter: CoverLetter;
  personal_info: PersonalInfo;
}
