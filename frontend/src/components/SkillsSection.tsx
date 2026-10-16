import { useState } from "react";
import RequiredCheckbox from "./RequiredCheckbox";
import { btnStyle, cardStyle, inputStyle, sectionStyle } from "./editorStyles";
import type { SkillCategory, TaggedItem } from "../types/resume.types";

interface Props {
  categories: SkillCategory[];
  onChange: (categories: SkillCategory[]) => void;
}

interface CategoryCardProps {
  category: SkillCategory;
  onChange: (category: SkillCategory) => void;
  onRemove: () => void;
}

function CategoryCard({ category, onChange, onRemove }: CategoryCardProps) {
  const [draft, setDraft] = useState("");

  function updateSkill(index: number, patch: Partial<TaggedItem>) {
    const skills = [...category.skills];
    skills[index] = { ...skills[index], ...patch };
    onChange({ ...category, skills });
  }

  function addSkill() {
    if (!draft.trim()) return;
    onChange({ ...category, skills: [...category.skills, { value: draft.trim(), required: false }] });
    setDraft("");
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <input
          style={{ ...inputStyle, marginBottom: 0, flex: 1, fontWeight: 600 }}
          placeholder="Nom de la catégorie (ex. Programming Languages)"
          value={category.category}
          onChange={(e) => onChange({ ...category, category: e.target.value })}
        />
        <button style={btnStyle("#e53935")} onClick={onRemove}>Supprimer la catégorie</button>
      </div>
      <div style={{ marginLeft: 8 }}>
        {category.skills.map((skill, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <input
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              value={skill.value}
              onChange={(e) => updateSkill(i, { value: e.target.value })}
            />
            <RequiredCheckbox checked={skill.required} onChange={(v) => updateSkill(i, { required: v })} />
            <button
              style={btnStyle("#e53935")}
              onClick={() => onChange({ ...category, skills: category.skills.filter((_, j) => j !== i) })}
            >
              ×
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            value={draft}
            placeholder="Ajouter une compétence..."
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
          />
          <button style={btnStyle("#555")} onClick={addSkill}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

export default function SkillsSection({ categories, onChange }: Props) {
  function update(index: number, category: SkillCategory) {
    const next = [...categories];
    next[index] = category;
    onChange(next);
  }

  return (
    <div style={sectionStyle}>
      <h2>Compétences techniques</h2>
      {categories.map((category, i) => (
        <CategoryCard
          key={i}
          category={category}
          onChange={(c) => update(i, c)}
          onRemove={() => onChange(categories.filter((_, j) => j !== i))}
        />
      ))}
      <button style={btnStyle("#1976d2")} onClick={() => onChange([...categories, { category: "", skills: [] }])}>
        + Ajouter une catégorie
      </button>
    </div>
  );
}
