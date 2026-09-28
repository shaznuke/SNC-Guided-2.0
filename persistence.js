// Preserve unreadable records instead of silently replacing them with defaults.
export const storageIssues = new Set();
export function storageKeys() {
  return Object.keys(localStorage).filter((k) => k.startsWith("snc_"));
}
export function readJSON(key, fallback, valid = () => true) {
  const raw = localStorage.getItem(key);
  if (raw === null) return structuredClone(fallback);
  try {
    const value = JSON.parse(raw);
    if (!valid(value)) throw new Error();
    return value;
  } catch {
    storageIssues.add(key);
    globalThis.window?.dispatchEvent(
      new CustomEvent("snc-storage-issue", { detail: { key } }),
    );
    return structuredClone(fallback);
  }
}
export function writeJSON(key, value) {
  if (storageIssues.has(key))
    throw new Error(
      "This saved record needs recovery. Export a backup from Settings before restoring it.",
    );
  localStorage.setItem(key, JSON.stringify(value));
}
const JOURNAL = "snc_restore_journal";
export function recoverTransaction() {
  const journal = localStorage.getItem(JOURNAL);
  if (!journal) return;
  const before = JSON.parse(journal);
  for (const key of Object.keys(before)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(before))
    if (value !== null) localStorage.setItem(key, value);
  localStorage.removeItem(JOURNAL);
}
export function transaction(values) {
  const before = Object.fromEntries(
    Object.keys(values).map((key) => [key, localStorage.getItem(key)]),
  );
  localStorage.setItem(JOURNAL, JSON.stringify(before));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    localStorage.removeItem(JOURNAL);
    for (const key of Object.keys(values)) storageIssues.delete(key);
  } catch (error) {
    try {
      recoverTransaction();
    } catch {
      throw new Error(
        "Restore interrupted. Export your data, then free device storage and reopen to recover.",
      );
    }
    throw error;
  }
}
export function downloadJSON(value, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
