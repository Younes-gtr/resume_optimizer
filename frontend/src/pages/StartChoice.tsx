import { useRef, useState } from "react";
import { readResumeJsonFile } from "../utils/resumeJson";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  onAnalyze: () => void;
  onJsonLoaded: (data: ResumeResponse) => void;
}

const choiceStyle: React.CSSProperties = {
  flex: 1,
  padding: "16px 20px",
  cursor: "pointer",
  fontSize: 14,
  textAlign: "left",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#f9f9f9",
};

export default function StartChoice({ onAnalyze, onJsonLoaded }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLoadJson() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier JSON.");
      return;
    }
    setError(null);
    try {
      onJsonLoaded(await readResumeJsonFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>Resume Optimizer</h1>
      <p style={{ color: "#555" }}>Comment voulez-vous commencer ?</p>

      <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <button onClick={onAnalyze} style={choiceStyle}>
          <strong>Analyser mon CV</strong>
          <br />
          <span style={{ color: "#555" }}>Collez votre CV (texte brut ou LaTeX), il sera converti en JSON.</span>
        </button>
        <button onClick={() => setShowUpload(true)} style={choiceStyle}>
          <strong>J'ai déjà un JSON complet</strong>
          <br />
          <span style={{ color: "#555" }}>Importez un cv.json téléchargé précédemment et passez l'analyse.</span>
        </button>
      </div>

      {showUpload && (
        <div style={{ marginTop: 24 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ marginBottom: 8, display: "block" }}
          />
          <button onClick={handleLoadJson} style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>
            Continuer
          </button>
          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
