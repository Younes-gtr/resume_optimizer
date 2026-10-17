import { useState } from "react";
import CoverLetterEditor from "./CoverLetterEditor";
import { btnStyle, inputStyle } from "./editorStyles";
import { downloadCoverLetterPdf, generateCoverLetter } from "../services/coverLetterService";
import { formatCoverLetterText, paragraphsToText, textToParagraphs } from "../utils/coverLetterText";
import type { CoverLetter } from "../types/coverLetter.types";
import type { PersonalInfo } from "../types/personalInfo.types";
import type { ResumeResponse } from "../types/resume.types";

interface Props {
  resumeData: ResumeResponse;
  jobOffer: string;
  personalInfo: PersonalInfo;
}

export default function CoverLetterSection({ resumeData, jobOffer, personalInfo }: Props) {
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [body, setBody] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalLetter: CoverLetter | null = letter && { ...letter, paragraphs: textToParagraphs(body) };
  const plainText = finalLetter ? formatCoverLetterText(finalLetter, personalInfo) : "";

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await generateCoverLetter(resumeData, jobOffer);
      setLetter(res.letter);
      setBody(paragraphsToText(res.letter.paragraphs));
      setWarnings(res.warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePdf() {
    if (!finalLetter) return;
    setPdfLoading(true);
    setError(null);
    try {
      await downloadCoverLetterPdf(finalLetter, personalInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 32, borderBottom: "1px solid #e0e0e0", paddingBottom: 24 }}>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Lettre de motivation</h2>
      <p style={{ color: "#555", fontSize: 13 }}>
        Générée en anglais à partir du CV et de l'offre uniquement. Vos informations personnelles ne sont pas envoyées au LLM.
      </p>
      <button onClick={handleGenerate} disabled={loading} style={{ ...btnStyle("#1976d2"), padding: "8px 20px", fontSize: 14 }}>
        {loading ? "Génération..." : letter ? "Régénérer la lettre" : "Générer la lettre de motivation"}
      </button>

      {letter && (
        <div style={{ marginTop: 16 }}>
          <p style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 4, padding: "8px 12px", fontSize: 13 }}>
            Relisez la lettre : le modèle peut reformuler ou embellir. Supprimez toute affirmation absente de votre CV.
          </p>
          {warnings.map((w) => (
            <p key={w} style={{ color: "#c62828", fontSize: 13, margin: "4px 0" }}>⚠ {w}</p>
          ))}

          <CoverLetterEditor letter={letter} body={body} onLetterChange={setLetter} onBodyChange={setBody} />

          <h3 style={{ fontSize: 14, margin: "16px 0 4px" }}>Aperçu (texte brut)</h3>
          <textarea readOnly rows={14} value={plainText} style={{ ...inputStyle, background: "#f5f5f5", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={handleCopy} style={{ ...btnStyle("#555"), padding: "8px 20px", fontSize: 14 }}>
              {copied ? "Copié !" : "Copier le texte"}
            </button>
            <button onClick={handlePdf} disabled={pdfLoading} style={{ ...btnStyle("#2e7d32"), padding: "8px 20px", fontSize: 14 }}>
              {pdfLoading ? "Génération..." : "Télécharger cover_letter.pdf"}
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 8 }}>Erreur : {error}</p>}
    </div>
  );
}
