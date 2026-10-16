import type { PersonalInfo } from "../types/personalInfo.types";

interface Props {
  value: PersonalInfo;
  onChange: (value: PersonalInfo) => void;
}

const FIELDS: { key: keyof PersonalInfo; label: string; placeholder: string; type: string }[] = [
  { key: "full_name", label: "Nom complet *", placeholder: "Prénom Nom", type: "text" },
  { key: "email", label: "Email", placeholder: "prenom.nom@email.com", type: "email" },
  { key: "phone", label: "Téléphone", placeholder: "+33 6 00 00 00 00", type: "tel" },
  { key: "location", label: "Ville", placeholder: "Ville, Pays", type: "text" },
  { key: "linkedin", label: "LinkedIn (URL)", placeholder: "https://www.linkedin.com/in/...", type: "url" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 14,
  padding: "6px 8px",
  boxSizing: "border-box",
  border: "1px solid #ccc",
  borderRadius: 4,
};

export default function PersonalInfoForm({ value, onChange }: Props) {
  function update(key: keyof PersonalInfo, raw: string) {
    // Empty optional fields are stored as null so they are omitted from the CV header.
    const next = key === "full_name" ? raw : raw.trim() ? raw : null;
    onChange({ ...value, [key]: next });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {FIELDS.map(({ key, label, placeholder, type }) => (
        <label key={key} style={{ fontSize: 13, color: "#333" }}>
          {label}
          <input
            type={type}
            value={value[key] ?? ""}
            placeholder={placeholder}
            onChange={(e) => update(key, e.target.value)}
            style={{ ...inputStyle, marginTop: 4 }}
          />
        </label>
      ))}
    </div>
  );
}
