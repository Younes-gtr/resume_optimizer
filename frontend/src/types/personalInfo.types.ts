// Identity and contact details. Used only to fill the LaTeX header — never sent to the LLM.
export interface PersonalInfo {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
}
