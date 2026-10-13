import { useState } from "react";
import { generateResponse } from "../services/llmService";

export default function LLMPlayground() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const data = await generateResponse(prompt);
      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <h1>LLM Playground</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Entrez votre prompt..."
          rows={6}
          style={{ width: "100%", fontSize: 14, padding: 8, boxSizing: "border-box" }}
        />
        <button type="submit" disabled={loading || !prompt.trim()} style={{ marginTop: 8 }}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 16 }}>Erreur : {error}</p>}
      {response && (
        <div style={{ marginTop: 24 }}>
          <h2>Réponse</h2>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f4f4f4", padding: 16, borderRadius: 4 }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
