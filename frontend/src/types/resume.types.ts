export interface TaggedItem {
  value: string;
  required: boolean;
}

export interface Experience {
  company: string;
  title: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string[];
  required: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  field: string | null;
  start_date: string;
  end_date: string | null;
  required: boolean;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url: string | null;
  required: boolean;
}

export interface Language {
  language: string;
  level: string | null;
  required: boolean;
}

export interface PersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string | null;
}

export interface ResumeRequest {
  cv_text: string;
}

export interface AdaptRequest {
  resume: ResumeResponse;
  job_offer: string;
}

export interface ResumeResponse {
  summary: string;
  education: Education[];
  experiences: Experience[];
  projects: Project[];
  skills: TaggedItem[];
  languages: Language[];
  interests: TaggedItem[];
}
