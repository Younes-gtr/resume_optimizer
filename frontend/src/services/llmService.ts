import type { LLMRequest, LLMResponse } from "../types/llm.types";

export async function generateResponse(prompt: string): Promise<LLMResponse> {
  const body: LLMRequest = { prompt };
  const res = await fetch("/api/v1/llm/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Erreur inconnue");
  }
  return res.json() as Promise<LLMResponse>;
}
