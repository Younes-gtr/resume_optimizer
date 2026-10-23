import { useState } from "react";
import { extractJobOffer } from "../services/jobOfferService";
import { adaptResume } from "../services/resumeService";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  resumeData: ResumeResponse;
  onAdapted: (adapted: ResumeResponse, jobOffer: string) => void;
  onSkip: () => void;
}

const URL_ONLY = /^https?:\/\/\S+$/;

function buttonStyle(background: string, color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "9px 22px",
    background: disabled ? "#aaa" : background,
    color: disabled ? "#fff" : color,
    border: "none",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14,
  };
}

export default function JobAdaptation({ resumeData, onAdapted, onSkip }: Props) {
  const [jobOffer, setJobOffer] = useState("");
  // What the user entered before the agent replaced it, to restore it.
  const [originalInput, setOriginalInput] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = extracting || loading;

  async function handleExtract() {
    if (!jobOffer.trim()) {
      setError("Collez le texte ou l'URL de l'offre.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const extracted = await extractJobOffer(jobOffer.trim());
      setOriginalInput(jobOffer);
      setJobOffer(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setExtracting(false);
    }
  }

  function handleRestore() {
    if (originalInput === null) return;
    setJobOffer(originalInput);
    setOriginalInput(null);
  }

  async function handleAdapt() {
    const offer = jobOffer.trim();
    if (!offer) {
      setError("Veuillez coller l'offre d'emploi ou de stage.");
      return;
    }
    if (URL_ONLY.test(offer)) {
      setError("Cliquez d'abord sur « Analyser l'offre » pour récupérer le contenu de cette URL.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adapted = await adaptResume(resumeData, offer);
      // The same text is kept for the cover letter.
      onAdapted(adapted, offer);
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
        Collez le texte de l'offre ou son URL. « Analyser l'offre » récupère la page si besoin et ne garde que
        l'offre (sans menus ni publicités). L'IA sélectionnera ensuite les éléments les plus pertinents de votre CV
        sans rien inventer ni supprimer les éléments obligatoires.
      </p>

      {originalInput !== null && (
        <p style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 4, padding: "8px 12px", fontSize: 13 }}>
          Offre extraite par l'agent : vérifiez-la et corrigez-la si besoin. C'est ce texte qui sera utilisé pour le CV
          et la lettre de motivation.{" "}
          <button onClick={handleRestore} disabled={busy} style={{ background: "none", border: "none", color: "#1565c0", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 13 }}>
            Revenir au texte d'origine
          </button>
        </p>
      )}

      <textarea
        value={jobOffer}
        onChange={(e) => setJobOffer(e.target.value)}
        placeholder="Collez ici le texte de l'offre d'emploi ou de stage, ou son URL (https://...)"
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
        <button onClick={handleExtract} disabled={busy} style={buttonStyle("#6a1b9a", "#fff", busy)}>
          {extracting ? "Analyse de l'offre..." : "Analyser l'offre"}
        </button>
        <button onClick={handleAdapt} disabled={busy} style={buttonStyle("#1976d2", "#fff", busy)}>
          {loading ? "Adaptation en cours..." : "Adapter le CV"}
        </button>
        <button onClick={onSkip} disabled={busy} style={buttonStyle("#eee", "#333", busy)}>
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
