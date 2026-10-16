export const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
  borderBottom: "1px solid #e0e0e0",
  paddingBottom: 24,
};

export const cardStyle: React.CSSProperties = {
  background: "#f9f9f9",
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "12px 16px",
  marginBottom: 10,
  position: "relative",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 14,
  padding: "6px 8px",
  boxSizing: "border-box",
  marginBottom: 6,
  border: "1px solid #ccc",
  borderRadius: 4,
};

export const btnStyle = (color: string): React.CSSProperties => ({
  background: color,
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "4px 10px",
  cursor: "pointer",
  fontSize: 13,
  marginRight: 6,
});
