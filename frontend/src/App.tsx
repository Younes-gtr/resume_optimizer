import { useState } from "react";
import StartChoice from "./pages/StartChoice";
import ResumeParser from "./pages/ResumeParser";
import ResumeEditor from "./pages/ResumeEditor";
import JobAdaptation from "./pages/JobAdaptation";
import PersonalInfoStep from "./pages/PersonalInfoStep";
import Done from "./pages/Done";
import type { PersonalInfo } from "./types/personalInfo.types";
import type { ResumeResponse } from "./types/resume.types";

type Step = "start" | "parse" | "edit" | "adapt" | "personal" | "done";

export default function App() {
  const [step, setStep] = useState<Step>("start");
  const [resumeData, setResumeData] = useState<ResumeResponse | null>(null);
  // Kept across restarts so the form is pre-filled for the next CV.
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  // Set only when the CV was adapted to a job offer: enables the cover letter.
  const [jobOffer, setJobOffer] = useState<string | null>(null);

  function handleParsed(data: ResumeResponse) {
    setResumeData(data);
    setStep("edit");
  }

  function handleFinalize(data: ResumeResponse) {
    setResumeData(data);
    setStep("adapt");
  }

  function handleAdapted(data: ResumeResponse, offer: string) {
    setResumeData(data);
    setJobOffer(offer);
    setStep("personal");
  }

  function handlePersonalInfo(data: PersonalInfo) {
    setPersonalInfo(data);
    setStep("done");
  }

  if (step === "start") {
    return <StartChoice onAnalyze={() => setStep("parse")} onJsonLoaded={handleParsed} />;
  }

  if (step === "parse") {
    return <ResumeParser onParsed={handleParsed} onBack={() => setStep("start")} />;
  }

  if (step === "edit" && resumeData) {
    return <ResumeEditor initialData={resumeData} onFinalize={handleFinalize} />;
  }

  if (step === "adapt" && resumeData) {
    return (
      <JobAdaptation
        resumeData={resumeData}
        onAdapted={handleAdapted}
        onSkip={() => { setJobOffer(null); setStep("personal"); }}
      />
    );
  }

  if (step === "personal") {
    return <PersonalInfoStep initialData={personalInfo} onSubmit={handlePersonalInfo} />;
  }

  if (step === "done" && resumeData && personalInfo) {
    return (
      <Done
        resumeData={resumeData}
        personalInfo={personalInfo}
        jobOffer={jobOffer}
        onRestart={() => { setResumeData(null); setJobOffer(null); setStep("start"); }}
      />
    );
  }

  return null;
}
