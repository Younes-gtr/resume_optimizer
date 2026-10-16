import { useState } from "react";
import type {
  ResumeResponse,
  Experience,
  Education,
  Project,
  Language,
  TaggedItem,
} from "../types/resume.types";
import RequiredCheckbox from "../components/RequiredCheckbox";
import SkillsSection from "../components/SkillsSection";
import { btnStyle, cardStyle, inputStyle, sectionStyle } from "../components/editorStyles";

interface Props {
  initialData: ResumeResponse;
  onFinalize: (data: ResumeResponse) => void;
}

// ── Tagged string list (interests) ────────────────────────────────────────────

function TaggedListSection({
  title,
  items,
  onChange,
}: {
  title: string;
  items: TaggedItem[];
  onChange: (items: TaggedItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function update(index: number, patch: Partial<TaggedItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    if (!draft.trim()) return;
    onChange([...items, { value: draft.trim(), required: false }]);
    setDraft("");
  }

  return (
    <div style={sectionStyle}>
      <h2>{title}</h2>
      {items.map((item, i) => (
        <div key={i} style={{ ...cardStyle, padding: "8px 12px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              value={item.value}
              onChange={(e) => update(i, { value: e.target.value })}
            />
            <button style={btnStyle("#e53935")} onClick={() => remove(i)}>Supprimer</button>
          </div>
          <RequiredCheckbox checked={item.required} onChange={(v) => update(i, { required: v })} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          value={draft}
          placeholder="Ajouter..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button style={btnStyle("#1976d2")} onClick={add}>Ajouter</button>
      </div>
    </div>
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

function SummarySection({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={sectionStyle}>
      <h2>Résumé</h2>
      <textarea
        rows={4}
        style={{ ...inputStyle, resize: "vertical" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

function EducationSection({ items, onChange }: { items: Education[]; onChange: (items: Education[]) => void }) {
  const empty: Education = { institution: "", degree: "", field: null, start_date: "", end_date: null, required: false };

  function update(index: number, patch: Partial<Education>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <div style={sectionStyle}>
      <h2>Formations</h2>
      {items.map((edu, i) => (
        <div key={i} style={cardStyle}>
          <input style={inputStyle} placeholder="Établissement" value={edu.institution} onChange={(e) => update(i, { institution: e.target.value })} />
          <input style={inputStyle} placeholder="Diplôme" value={edu.degree} onChange={(e) => update(i, { degree: e.target.value })} />
          <input style={inputStyle} placeholder="Domaine" value={edu.field ?? ""} onChange={(e) => update(i, { field: e.target.value || null })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Début" value={edu.start_date} onChange={(e) => update(i, { start_date: e.target.value })} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Fin" value={edu.end_date ?? ""} onChange={(e) => update(i, { end_date: e.target.value || null })} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <RequiredCheckbox checked={edu.required} onChange={(v) => update(i, { required: v })} />
            <button style={btnStyle("#e53935")} onClick={() => onChange(items.filter((_, j) => j !== i))}>Supprimer</button>
          </div>
        </div>
      ))}
      <button style={btnStyle("#1976d2")} onClick={() => onChange([...items, { ...empty }])}>+ Ajouter une formation</button>
    </div>
  );
}

// ── Experiences ───────────────────────────────────────────────────────────────

function ExperiencesSection({ items, onChange }: { items: Experience[]; onChange: (items: Experience[]) => void }) {
  const empty: Experience = { company: "", title: "", location: null, start_date: "", end_date: null, current: false, description: [], required: false };

  function update(index: number, patch: Partial<Experience>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateDesc(expIndex: number, descIndex: number, value: string) {
    const next = [...items];
    next[expIndex].description[descIndex] = value;
    onChange(next);
  }

  function addDesc(expIndex: number) {
    const next = [...items];
    next[expIndex].description = [...next[expIndex].description, ""];
    onChange(next);
  }

  function removeDesc(expIndex: number, descIndex: number) {
    const next = [...items];
    next[expIndex].description = next[expIndex].description.filter((_, i) => i !== descIndex);
    onChange(next);
  }

  return (
    <div style={sectionStyle}>
      <h2>Expériences professionnelles</h2>
      {items.map((exp, i) => (
        <div key={i} style={cardStyle}>
          <input style={inputStyle} placeholder="Entreprise" value={exp.company} onChange={(e) => update(i, { company: e.target.value })} />
          <input style={inputStyle} placeholder="Poste" value={exp.title} onChange={(e) => update(i, { title: e.target.value })} />
          <input style={inputStyle} placeholder="Lieu" value={exp.location ?? ""} onChange={(e) => update(i, { location: e.target.value || null })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Début" value={exp.start_date} onChange={(e) => update(i, { start_date: e.target.value })} />
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Fin" value={exp.end_date ?? ""} onChange={(e) => update(i, { end_date: e.target.value || null })} />
          </div>
          <label style={{ fontSize: 13, marginBottom: 8, display: "block" }}>
            <input type="checkbox" checked={exp.current} onChange={(e) => update(i, { current: e.target.checked })} style={{ marginRight: 6 }} />
            Poste actuel
          </label>
          <div style={{ marginLeft: 8 }}>
            <p style={{ fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Description</p>
            {exp.description.map((line, di) => (
              <div key={di} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} value={line} onChange={(e) => updateDesc(i, di, e.target.value)} />
                <button style={btnStyle("#e53935")} onClick={() => removeDesc(i, di)}>×</button>
              </div>
            ))}
            <button style={{ ...btnStyle("#555"), marginTop: 4 }} onClick={() => addDesc(i)}>+ Ajouter une ligne</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <RequiredCheckbox checked={exp.required} onChange={(v) => update(i, { required: v })} />
            <button style={btnStyle("#e53935")} onClick={() => onChange(items.filter((_, j) => j !== i))}>Supprimer l'expérience</button>
          </div>
        </div>
      ))}
      <button style={btnStyle("#1976d2")} onClick={() => onChange([...items, { ...empty }])}>+ Ajouter une expérience</button>
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────

function ProjectsSection({ items, onChange }: { items: Project[]; onChange: (items: Project[]) => void }) {
  const empty: Project = { name: "", description: "", technologies: [], url: null, show_technologies: true, required: false };

  function update(index: number, patch: Partial<Project>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateTech(projIndex: number, techIndex: number, value: string) {
    const next = [...items];
    next[projIndex].technologies[techIndex] = value;
    onChange(next);
  }

  function addTech(projIndex: number) {
    const next = [...items];
    next[projIndex].technologies = [...next[projIndex].technologies, ""];
    onChange(next);
  }

  function removeTech(projIndex: number, techIndex: number) {
    const next = [...items];
    next[projIndex].technologies = next[projIndex].technologies.filter((_, i) => i !== techIndex);
    onChange(next);
  }

  return (
    <div style={sectionStyle}>
      <h2>Projets</h2>
      {items.map((proj, i) => (
        <div key={i} style={cardStyle}>
          <input style={inputStyle} placeholder="Nom du projet" value={proj.name} onChange={(e) => update(i, { name: e.target.value })} />
          <textarea style={{ ...inputStyle, resize: "vertical" }} placeholder="Description" rows={2} value={proj.description} onChange={(e) => update(i, { description: e.target.value })} />
          <input style={inputStyle} placeholder="URL (optionnel)" value={proj.url ?? ""} onChange={(e) => update(i, { url: e.target.value || null })} />
          <div style={{ marginLeft: 8 }}>
            <p style={{ fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Technologies</p>
            {proj.technologies.map((tech, ti) => (
              <div key={ti} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} value={tech} onChange={(e) => updateTech(i, ti, e.target.value)} />
                <button style={btnStyle("#e53935")} onClick={() => removeTech(i, ti)}>×</button>
              </div>
            ))}
            <button style={{ ...btnStyle("#555"), marginTop: 4 }} onClick={() => addTech(i)}>+ Ajouter</button>
          </div>
          <label style={{ fontSize: 13, margin: "8px 0 0 8px", display: "block" }}>
            <input type="checkbox" checked={proj.show_technologies} onChange={(e) => update(i, { show_technologies: e.target.checked })} style={{ marginRight: 6 }} />
            Afficher la ligne "Technologies" dans le CV
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <RequiredCheckbox checked={proj.required} onChange={(v) => update(i, { required: v })} />
            <button style={btnStyle("#e53935")} onClick={() => onChange(items.filter((_, j) => j !== i))}>Supprimer le projet</button>
          </div>
        </div>
      ))}
      <button style={btnStyle("#1976d2")} onClick={() => onChange([...items, { ...empty }])}>+ Ajouter un projet</button>
    </div>
  );
}

// ── Languages ─────────────────────────────────────────────────────────────────

function LanguagesSection({ items, onChange }: { items: Language[]; onChange: (items: Language[]) => void }) {
  function update(index: number, patch: Partial<Language>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  return (
    <div style={sectionStyle}>
      <h2>Langues</h2>
      {items.map((lang, i) => (
        <div key={i} style={{ ...cardStyle, padding: "8px 12px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input style={{ ...inputStyle, marginBottom: 0, flex: 2 }} placeholder="Langue" value={lang.language} onChange={(e) => update(i, { language: e.target.value })} />
            <input style={{ ...inputStyle, marginBottom: 0, flex: 1 }} placeholder="Niveau" value={lang.level ?? ""} onChange={(e) => update(i, { level: e.target.value || null })} />
            <button style={btnStyle("#e53935")} onClick={() => onChange(items.filter((_, j) => j !== i))}>Supprimer</button>
          </div>
          <RequiredCheckbox checked={lang.required} onChange={(v) => update(i, { required: v })} />
        </div>
      ))}
      <button style={btnStyle("#1976d2")} onClick={() => onChange([...items, { language: "", level: null, required: false }])}>+ Ajouter une langue</button>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export default function ResumeEditor({ initialData, onFinalize }: Props) {
  const [resume, setResume] = useState<ResumeResponse>(initialData);

  function patch<K extends keyof ResumeResponse>(key: K, value: ResumeResponse[K]) {
    setResume((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>Éditeur de CV</h1>
      <p style={{ color: "#555" }}>Vérifiez et corrigez les informations extraites.</p>

      <SummarySection value={resume.summary} onChange={(v) => patch("summary", v)} />
      <EducationSection items={resume.education} onChange={(v) => patch("education", v)} />
      <ExperiencesSection items={resume.experiences} onChange={(v) => patch("experiences", v)} />
      <ProjectsSection items={resume.projects} onChange={(v) => patch("projects", v)} />
      <SkillsSection categories={resume.skills} onChange={(v) => patch("skills", v)} />
      <LanguagesSection items={resume.languages} onChange={(v) => patch("languages", v)} />
      <TaggedListSection title="Centres d'intérêts" items={resume.interests} onChange={(v) => patch("interests", v)} />

      <button
        onClick={() => onFinalize(resume)}
        style={{ ...btnStyle("#2e7d32"), fontSize: 15, padding: "10px 24px", marginBottom: 48 }}
      >
        Valider le CV
      </button>
    </div>
  );
}
