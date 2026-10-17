import type { CoverLetter } from "../types/coverLetter.types";
import type { PersonalInfo } from "../types/personalInfo.types";

// Same layout as the PDF rendered by the backend (cover_letter_pdf_service.py).
export function formatCoverLetterText(letter: CoverLetter, info: PersonalInfo, day: Date = new Date()): string {
  const date = day.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const blocks: string[] = [
    [info.full_name, info.location, info.email, info.phone, info.linkedin].filter(Boolean).join("\n"),
    date,
  ];
  const recipient = [letter.recipient, letter.company, letter.company_location].filter(Boolean).join("\n");
  if (recipient) blocks.push(recipient);
  if (letter.job_title) blocks.push(`Subject: Application for ${letter.job_title}`);
  blocks.push(letter.recipient ? `Dear ${letter.recipient},` : "Dear Hiring Manager,");
  blocks.push(...letter.paragraphs.filter((p) => p.trim()));
  blocks.push(`Sincerely,\n\n${info.full_name}`);
  return blocks.join("\n\n");
}

export function paragraphsToText(paragraphs: string[]): string {
  return paragraphs.join("\n\n");
}

export function textToParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
