interface Props {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function RequiredCheckbox({ checked, onChange }: Props) {
  return (
    <label style={{ fontSize: 12, color: "#555", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Obligatoire
    </label>
  );
}
