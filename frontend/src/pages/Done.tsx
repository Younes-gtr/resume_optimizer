import { useRef, useState } from "react";
import { generateLatex } from "../services/latexService";
import { downloadJson } from "../utils/jsonFile";
import { readResumeJsonFile } from "../utils/resumeJson";
import type { PersonalInfo } from "../types/personalInfo.types";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  resumeData: ResumeResponse;
  personalInfo: PersonalInfo;
  onRestart: () => void;
}

const sectionStyle: React.CSSProperties = { marginBottom: 32, borderBottom: "1px solid #e0e0e0", paddingBottom: 24 };
const buttonStyle: React.CSSProperties = { padding: "8px 20px", cursor: "pointer", fontSize: 14 };
const primaryStyle: React.CSSProperties = { ...buttonStyle, background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4 };

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 16px", cursor: "pointer", fontSize: 13, border: "none", borderRadius: 4,
    background: active ? "#1976d2" : "#eee",
    color: active ? "#fff" : "#333",
  };
}

export default function Done({ resumeData, personalInfo, onRestart }: Props) {
  const [latexLoading, setLatexLoading] = useState(false);
  const [latexError, setLatexError] = useState<string | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runLatex(resume: ResumeResponse) {
    setLatexLoading(true);
    setLatexError(null);
    try {
      await generateLatex(resume, personalInfo);
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
    try {
      await runLatex(await readResumeJsonFile(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>CV finalisé</h1>
      <p style={{ color: "#2e7d32", fontWeight: 600 }}>Votre CV a été validé avec succès.</p>

      <div style={{ ...sectionStyle, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Télécharger les JSON</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => downloadJson(resumeData, "cv.json")} style={buttonStyle}>
            Télécharger cv.json
          </button>
          <button onClick={() => downloadJson(personalInfo, "personal_info.json")} style={buttonStyle}>
            Télécharger personal_info.json
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Générer le fichier .tex</h2>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button onClick={() => { setUseUpload(false); setUploadError(null); }} style={toggleStyle(!useUpload)}>
            Utiliser le JSON courant
          </button>
          <button onClick={() => { setUseUpload(true); setLatexError(null); }} style={toggleStyle(useUpload)}>
            Uploader un JSON
          </button>
        </div>

        {useUpload ? (
          <div>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ marginBottom: 8, display: "block" }} />
            {uploadError && <p style={{ color: "red", margin: "4px 0 8px" }}>{uploadError}</p>}
            <button onClick={handleLatexFromUpload} disabled={latexLoading} style={primaryStyle}>
              {latexLoading ? "Génération..." : "Générer depuis ce JSON"}
            </button>
          </div>
        ) : (
          <button onClick={() => runLatex(resumeData)} disabled={latexLoading} style={primaryStyle}>
            {latexLoading ? "Génération..." : "Télécharger cv.tex"}
          </button>
        )}

        {latexError && <p style={{ color: "red", marginTop: 8 }}>Erreur : {latexError}</p>}
      </div>

      <button onClick={onRestart} style={buttonStyle}>
        Recommencer
      </button>
    </div>
  );
}
