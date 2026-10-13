import { useRef, useState } from "react";
import ResumeParser from "./pages/ResumeParser";
import ResumeEditor from "./pages/ResumeEditor";
import JobAdaptation from "./pages/JobAdaptation";
import { generateLatex } from "./services/latexService";
import type { ResumeResponse } from "./types/resume.types";

type Step = "parse" | "edit" | "adapt" | "done";

const EXPECTED_KEYS: (keyof ResumeResponse)[] = [
  "summary", "education", "experiences", "projects", "skills", "languages", "interests",
];

function validateResumeJson(data: unknown): data is ResumeResponse {
  if (typeof data !== "object" || data === null) return false;
  return EXPECTED_KEYS.every((k) => k in (data as object));
}

function downloadJson(data: ResumeResponse) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cv.json";
  a.click();
  URL.revokeObjectURL(url);
}

function Done({ resumeData, onRestart }: { resumeData: ResumeResponse; onRestart: () => void }) {
  const [latexLoading, setLatexLoading] = useState(false);
  const [latexError, setLatexError] = useState<string | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLatexFromCurrent() {
    setLatexLoading(true);
    setLatexError(null);
    try {
      await generateLatex(resumeData);
    } catch (err) {
      setLatexError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLatexLoading(false);
    }
  }

  async function handleLatexFromUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Veuillez sélectionner un fichier JSON.");
      return;
    }
    setUploadError(null);
    setLatexLoading(true);
    setLatexError(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setUploadError("Fichier JSON invalide.");
        return;
      }
      if (!validateResumeJson(parsed)) {
        setUploadError("Le JSON ne correspond pas au format attendu.");
        return;
      }
      await generateLatex(parsed);
    } catch (err) {
      setLatexError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLatexLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>CV finalisé</h1>
      <p style={{ color: "#2e7d32", fontWeight: 600 }}>Votre CV a été validé avec succès.</p>

      <div style={{ marginTop: 24, marginBottom: 32, borderBottom: "1px solid #e0e0e0", paddingBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Télécharger le JSON</h2>
        <button
          onClick={() => downloadJson(resumeData)}
          style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}
        >
          Télécharger cv.json
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Générer le fichier .tex</h2>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => { setUseUpload(false); setUploadError(null); }}
            style={{
              padding: "6px 16px", cursor: "pointer", fontSize: 13,
              background: !useUpload ? "#1976d2" : "#eee",
              color: !useUpload ? "#fff" : "#333",
              border: "none", borderRadius: 4,
            }}
          >
            Utiliser le JSON courant
          </button>
          <button
            onClick={() => { setUseUpload(true); setLatexError(null); }}
            style={{
              padding: "6px 16px", cursor: "pointer", fontSize: 13,
              background: useUpload ? "#1976d2" : "#eee",
              color: useUpload ? "#fff" : "#333",
              border: "none", borderRadius: 4,
            }}
          >
            Uploader un JSON
          </button>
        </div>

        {!useUpload && (
          <button
            onClick={handleLatexFromCurrent}
            disabled={latexLoading}
            style={{ padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}
          >
            {latexLoading ? "Génération..." : "Télécharger cv.tex"}
          </button>
        )}

        {useUpload && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ marginBottom: 8, display: "block" }}
            />
            {uploadError && <p style={{ color: "red", margin: "4px 0 8px" }}>{uploadError}</p>}
            <button
              onClick={handleLatexFromUpload}
              disabled={latexLoading}
              style={{ padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}
            >
              {latexLoading ? "Génération..." : "Générer depuis ce JSON"}
            </button>
          </div>
        )}

        {latexError && <p style={{ color: "red", marginTop: 8 }}>Erreur : {latexError}</p>}
      </div>

      <button onClick={onRestart} style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>
        Recommencer
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("parse");
  const [resumeData, setResumeData] = useState<ResumeResponse | null>(null);

  function handleParsed(data: ResumeResponse) {
    setResumeData(data);
    setStep("edit");
  }

  function handleFinalize(data: ResumeResponse) {
    setResumeData(data);
    setStep("adapt");
  }

  function handleAdapted(data: ResumeResponse) {
    setResumeData(data);
    setStep("done");
  }

  function handleSkipAdapt() {
    setStep("done");
  }

  if (step === "parse") {
    return <ResumeParser onParsed={handleParsed} />;
  }

  if (step === "edit" && resumeData) {
    return <ResumeEditor initialData={resumeData} onFinalize={handleFinalize} />;
  }

  if (step === "adapt" && resumeData) {
    return (
      <JobAdaptation
        resumeData={resumeData}
        onAdapted={handleAdapted}
        onSkip={handleSkipAdapt}
      />
    );
  }

  if (step === "done" && resumeData) {
    return (
      <Done
        resumeData={resumeData}
        onRestart={() => { setResumeData(null); setStep("parse"); }}
      />
    );
  }

  return null;
}
