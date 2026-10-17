import { inputStyle } from "./editorStyles";
import type { CoverLetter } from "../types/coverLetter.types";

interface Props {
  letter: CoverLetter;
  body: string;
  onLetterChange: (letter: CoverLetter) => void;
  onBodyChange: (body: string) => void;
}

type HeaderField = "company" | "company_location" | "job_title" | "recipient";

const FIELDS: { key: HeaderField; label: string }[] = [
  { key: "company", label: "Entreprise" },
  { key: "company_location", label: "Lieu de l'entreprise" },
  { key: "job_title", label: "Intitulé du poste" },
  { key: "recipient", label: "Destinataire (vide = \"Dear Hiring Manager\")" },
];

export default function CoverLetterEditor({ letter, body, onLetterChange, onBodyChange }: Props) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
        {FIELDS.map(({ key, label }) => (
          <label key={key} style={{ fontSize: 13, color: "#333" }}>
            {label}
            <input
              style={{ ...inputStyle, marginTop: 4 }}
              value={letter[key] ?? ""}
              onChange={(e) => onLetterChange({ ...letter, [key]: e.target.value.trim() ? e.target.value : null })}
            />
          </label>
        ))}
      </div>
      <label style={{ fontSize: 13, color: "#333", display: "block", marginTop: 8 }}>
        Corps de la lettre (une ligne vide entre deux paragraphes)
        <textarea
          rows={16}
          style={{ ...inputStyle, marginTop: 4, resize: "vertical", lineHeight: 1.5 }}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
        />
      </label>
    </div>
  );
}
