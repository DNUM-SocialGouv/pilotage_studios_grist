/**
 * Client HTTP essai → service Onyxia `/v1/ask` (contrat #138).
 */

import {
  isAssistantConfigReady,
  normalizeAssistantBaseUrl,
  type AssistantEssaiConfig,
} from "./assistantConfig.ts";

export type AssistantAskContext = {
  screen?: string;
  entityType?: string;
  entityId?: number | string;
  entityLabel?: string;
  facts?: Record<string, unknown>;
  /** Question précédente, pour « liste ces produits ». */
  previousQuestion?: string;
};

export type AssistantAskResult = {
  message: string;
  data: unknown;
};

export class AssistantAskError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "AssistantAskError";
    this.code = code;
    this.status = status;
  }
}

export type AssistantHealth = {
  ok: boolean;
  litellmConfigured?: boolean;
  model?: string;
  runtime?: string;
  /** True seulement si le service Python a GRIST_* pour Le PARC. */
  parcConfigured?: boolean;
};

export async function fetchAssistantHealth(
  config: AssistantEssaiConfig,
  signal?: AbortSignal,
): Promise<AssistantHealth> {
  if (!isAssistantConfigReady(config)) {
    throw new AssistantAskError(
      "not_configured",
      "Indiquez l’URL du service d’essai (Onyxia, port 5000).",
    );
  }
  const base = normalizeAssistantBaseUrl(config.baseUrl);
  const res = await fetch(`${base}/health`, { method: "GET", signal });
  if (!res.ok) {
    throw new AssistantAskError(
      "health_failed",
      `Le service ne répond pas (HTTP ${res.status}). Vérifiez qu’uvicorn tourne.`,
      res.status,
    );
  }
  return (await res.json()) as AssistantHealth;
}

export async function askAssistant(
  config: AssistantEssaiConfig,
  question: string,
  context?: AssistantAskContext,
  signal?: AbortSignal,
): Promise<AssistantAskResult> {
  const q = question.trim();
  if (!q) {
    throw new AssistantAskError("missing_question", "Écrivez une question.");
  }
  if (!isAssistantConfigReady(config)) {
    throw new AssistantAskError(
      "not_configured",
      "Indiquez l’URL du service d’essai (Onyxia, port 5000) dans les paramètres du tiroir.",
    );
  }

  const base = normalizeAssistantBaseUrl(config.baseUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.sharedSecret) {
    headers.Authorization = `Bearer ${config.sharedSecret}`;
  }

  const res = await fetch(`${base}/v1/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: q,
      context: context ?? undefined,
    }),
    signal,
  });

  let body: { message?: string; data?: unknown; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : `Appel impossible (HTTP ${res.status}).`;
    throw new AssistantAskError(
      typeof body.error === "string" ? body.error : "ask_failed",
      msg,
      res.status,
    );
  }

  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "Je n’ai pas pu formuler de réponse.";

  return { message, data: body.data ?? null };
}
