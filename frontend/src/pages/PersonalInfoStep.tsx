import { useRef, useState } from "react";
import PersonalInfoForm from "../components/PersonalInfoForm";
import { readPersonalInfoJsonFile } from "../utils/personalInfoJson";
import type { PersonalInfo } from "../types/personalInfo.types";

interface Props {
  initialData: PersonalInfo | null;
  onSubmit: (data: PersonalInfo) => void;
}

const EMPTY_INFO: PersonalInfo = { full_name: "", email: null, phone: null, location: null, linkedin: null };

function toggleStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 16px", cursor: "pointer", fontSize: 13, border: "none", borderRadius: 4,
    background: active ? "#1976d2" : "#eee",
    color: active ? "#fff" : "#333",
  };
}

export default function PersonalInfoStep({ initialData, onSubmit }: Props) {
  const [info, setInfo] = useState<PersonalInfo>(initialData ?? EMPTY_INFO);
  const [useUpload, setUseUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier JSON.");
      return;
    }
    setError(null);
    try {
      setInfo(await readPersonalInfoJsonFile(file));
      setUseUpload(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  function handleContinue() {
    if (!info.full_name.trim()) {
      setError("Le nom complet est obligatoire.");
      return;
    }
    onSubmit({ ...info, full_name: info.full_name.trim() });
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>Informations personnelles</h1>
      <p style={{ color: "#555" }}>
        Ces informations remplissent l'en-tête du CV. Elles restent sur votre machine et ne sont jamais envoyées au LLM.
      </p>

      <div style={{ display: "flex", gap: 12, margin: "16px 0 24px" }}>
        <button onClick={() => { setUseUpload(false); setError(null); }} style={toggleStyle(!useUpload)}>
          Saisir mes informations
        </button>
        <button onClick={() => { setUseUpload(true); setError(null); }} style={toggleStyle(useUpload)}>
          Importer un JSON
        </button>
      </div>

      {useUpload ? (
        <div>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ marginBottom: 8, display: "block" }} />
          <button onClick={handleImport} style={{ padding: "8px 20px", cursor: "pointer", fontSize: 14 }}>
            Importer
          </button>
        </div>
      ) : (
        <>
          <PersonalInfoForm value={info} onChange={setInfo} />
          <button
            onClick={handleContinue}
            style={{ marginTop: 20, padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}
          >
            Continuer
          </button>
        </>
      )}

      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
