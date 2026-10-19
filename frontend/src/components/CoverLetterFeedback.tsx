import { useState } from "react";
import { btnStyle, inputStyle } from "./editorStyles";

interface Props {
  loading: boolean;
  canUndo: boolean;
  onSubmit: (feedback: string) => Promise<boolean>;
  onUndo: () => void;
}

export default function CoverLetterFeedback({ loading, canUndo, onSubmit, onUndo }: Props) {
  const [feedback, setFeedback] = useState("");

  async function handleSubmit() {
    if (!feedback.trim()) return;
    if (await onSubmit(feedback.trim())) setFeedback("");
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 4px" }}>Corriger avec des remarques</h3>
      <p style={{ color: "#555", fontSize: 13, margin: "0 0 6px" }}>
        Décrivez ce qu'il faut changer (en français ou en anglais). Seuls les points demandés sont modifiés ; vos
        modifications manuelles sont conservées.
      </p>
      <textarea
        rows={3}
        value={feedback}
        placeholder={"Ex. : J'ai déjà obtenu mon diplôme d'ingénieur. Mentionne davantage mon projet de compilateur."}
        onChange={(e) => setFeedback(e.target.value)}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !feedback.trim()}
          style={{ ...btnStyle("#1976d2"), padding: "8px 20px", fontSize: 14 }}
        >
          {loading ? "Révision..." : "Appliquer les remarques"}
        </button>
        {canUndo && (
          <button onClick={onUndo} disabled={loading} style={{ ...btnStyle("#777"), padding: "8px 20px", fontSize: 14 }}>
            Annuler la dernière révision
          </button>
        )}
      </div>
    </div>
  );
}
