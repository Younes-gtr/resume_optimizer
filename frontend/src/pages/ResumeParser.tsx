import { useState } from "react";
import { parseResume } from "../services/resumeService";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  onParsed: (data: ResumeResponse) => void;
}

export default function ResumeParser({ onParsed }: Props) {
  const [cvText, setCvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseResume(cvText);
      onParsed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>Resume Optimizer</h1>
      <p style={{ color: "#555" }}>Collez votre CV (texte brut ou LaTeX) pour commencer.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Collez votre CV ici..."
          rows={16}
          style={{ width: "100%", fontSize: 14, padding: 8, boxSizing: "border-box" }}
        />
        <button type="submit" disabled={loading || !cvText.trim()} style={{ marginTop: 8 }}>
          {loading ? "Analyse en cours..." : "Analyser le CV"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 16 }}>Erreur : {error}</p>}
    </div>
  );
}
