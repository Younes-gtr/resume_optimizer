import { useState } from "react";
import { adaptResume } from "../services/resumeService";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  resumeData: ResumeResponse;
  onAdapted: (adapted: ResumeResponse, jobOffer: string) => void;
  onSkip: () => void;
}

export default function JobAdaptation({ resumeData, onAdapted, onSkip }: Props) {
  const [jobOffer, setJobOffer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdapt() {
    if (!jobOffer.trim()) {
      setError("Veuillez coller l'offre d'emploi ou de stage.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adapted = await adaptResume(resumeData, jobOffer.trim());
      onAdapted(adapted, jobOffer.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>Adapter le CV à une offre</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Collez l'offre d'emploi ou de stage ci-dessous. L'IA sélectionnera les éléments les plus
        pertinents de votre CV sans rien inventer ni supprimer les éléments obligatoires.
      </p>

      <textarea
        value={jobOffer}
        onChange={(e) => setJobOffer(e.target.value)}
        placeholder="Collez ici le texte de l'offre d'emploi ou de stage..."
        rows={14}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 14,
          border: "1px solid #ccc",
          borderRadius: 4,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={handleAdapt}
          disabled={loading}
          style={{
            padding: "9px 22px",
            background: loading ? "#aaa" : "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {loading ? "Adaptation en cours..." : "Adapter le CV"}
        </button>
        <button
          onClick={onSkip}
          disabled={loading}
          style={{
            padding: "9px 22px",
            background: "#eee",
            color: "#333",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
