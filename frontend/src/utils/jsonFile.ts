export async function readJsonFile<T>(file: File, isValid: (data: unknown) => data is T): Promise<T> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Fichier JSON invalide.");
  }
  if (!isValid(parsed)) {
    throw new Error("Le JSON ne correspond pas au format attendu.");
  }
  return parsed;
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
