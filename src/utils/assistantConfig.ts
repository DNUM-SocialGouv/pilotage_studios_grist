/**
 * Config essai Assistant : URL du service Onyxia + jeton Bearer.
 * Stockage session uniquement (pas de secret LiteLLM, pas de VITE_* secret).
 */

const STORAGE_KEY = "pilotage.assistant.essai.v1";

export type AssistantEssaiConfig = {
  baseUrl: string;
  sharedSecret: string;
};

export function emptyAssistantConfig(): AssistantEssaiConfig {
  return { baseUrl: "", sharedSecret: "" };
}

export function normalizeAssistantBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export function loadAssistantConfig(): AssistantEssaiConfig {
  if (typeof sessionStorage === "undefined") {
    return emptyAssistantConfig();
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAssistantConfig();
    const parsed = JSON.parse(raw) as Partial<AssistantEssaiConfig>;
    return {
      baseUrl: normalizeAssistantBaseUrl(String(parsed.baseUrl ?? "")),
      sharedSecret: String(parsed.sharedSecret ?? "").trim(),
    };
  } catch {
    return emptyAssistantConfig();
  }
}

export function saveAssistantConfig(config: AssistantEssaiConfig): AssistantEssaiConfig {
  const next: AssistantEssaiConfig = {
    baseUrl: normalizeAssistantBaseUrl(config.baseUrl),
    sharedSecret: config.sharedSecret.trim(),
  };
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearAssistantConfig(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function isAssistantConfigReady(config: AssistantEssaiConfig): boolean {
  return normalizeAssistantBaseUrl(config.baseUrl).length > 0;
}
