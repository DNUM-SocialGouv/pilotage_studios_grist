/**
 * Service d’essai Assistant Pilotage — contrat V0.
 *
 * GET  /health
 * POST /v1/ask  { question, context? } → { message, data }
 *
 * Secrets : LITELLM_* et ASSISTANT_SHARED_SECRET via env uniquement.
 * Pas d’accès Grist ici (V0) : le widget enverra plus tard des extraits / outils.
 */

import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

loadDotEnv(resolve(__dirname, ".env"));

const PORT = Number(process.env.PORT || 8080);
const LITELLM_BASE_URL = (process.env.LITELLM_BASE_URL || "").replace(/\/$/, "");
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || "";
const LITELLM_MODEL = process.env.LITELLM_MODEL || "mistral-small";
const SHARED_SECRET = process.env.ASSISTANT_SHARED_SECRET || "";
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5175,https://dnum-socialgouv.github.io"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SYSTEM_PROMPT = `Tu es l’assistant de lecture du Pilotage studios (missions, bons de commande, produits, CRA).
Tu réponds en français, clairement, sans jargon inutile.
Tu n’inventes pas de montants ni de jours : si tu n’as pas de chiffre fourni dans le message, dis-le et pose une question de clarification.
Tu ne proposes pas de modifier Grist.`;

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function sendJson(res, status, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (origin && CORS_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers.Vary = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 64_000) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authorize(req) {
  if (!SHARED_SECRET) return true;
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return Boolean(m && m[1] === SHARED_SECRET);
}

function formatContext(context) {
  if (!context || typeof context !== "object") return "";
  const bits = [];
  if (context.screen) bits.push(`Écran : ${context.screen}`);
  if (context.entityType && context.entityLabel) {
    bits.push(`Élément ouvert : ${context.entityType} — ${context.entityLabel}`);
  } else if (context.entityType) {
    bits.push(`Type d’élément : ${context.entityType}`);
  }
  if (context.entityId != null) bits.push(`Id : ${context.entityId}`);
  if (context.facts && typeof context.facts === "object") {
    bits.push(`Faits fournis (ne pas inventer ailleurs) : ${JSON.stringify(context.facts)}`);
  }
  return bits.length ? `\n\nContexte widget :\n- ${bits.join("\n- ")}` : "";
}

async function callLiteLlm(question, context) {
  if (!LITELLM_BASE_URL || !LITELLM_API_KEY) {
    const err = new Error("litellm_not_configured");
    err.code = "litellm_not_configured";
    throw err;
  }
  const userContent = `${question.trim()}${formatContext(context)}`;
  const url = `${LITELLM_BASE_URL}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LITELLM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
    }),
  });
  const raw = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!res.ok) {
    const err = new Error("litellm_upstream");
    err.code = "litellm_upstream";
    err.status = res.status;
    err.detail = parsed?.error?.message || raw.slice(0, 200);
    throw err;
  }
  const message =
    parsed?.choices?.[0]?.message?.content?.trim() ||
    "Je n’ai pas pu formuler de réponse.";
  return message;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {}, origin);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(
      res,
      200,
      {
        ok: true,
        service: "pilotage-assistant-essai",
        runtime: "node",
        litellmConfigured: Boolean(LITELLM_BASE_URL && LITELLM_API_KEY),
        authRequired: Boolean(SHARED_SECRET),
        model: LITELLM_MODEL,
        // Assistant PARC = Python (app.py) uniquement
        parcConfigured: false,
      },
      origin,
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/v1/ask") {
    if (!authorize(req)) {
      sendJson(res, 401, { error: "unauthorized", message: "Jeton manquant ou invalide." }, origin);
      return;
    }
    let body;
    try {
      const raw = await readBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      const status = e.message === "payload_too_large" ? 413 : 400;
      sendJson(
        res,
        status,
        {
          error: status === 413 ? "payload_too_large" : "invalid_json",
          message: "Corps de requête invalide.",
        },
        origin,
      );
      return;
    }
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      sendJson(
        res,
        400,
        { error: "missing_question", message: "Le champ « question » est obligatoire." },
        origin,
      );
      return;
    }
    const ctx = body.context && typeof body.context === "object" ? body.context : null;
    const entityType = ctx && typeof ctx.entityType === "string" ? ctx.entityType.trim() : "";
    const screen = ctx && typeof ctx.screen === "string" ? ctx.screen.trim() : "";
    const isParc =
      entityType === "parc_produit" ||
      screen === "/assistant-parc" ||
      screen.startsWith("/assistant-parc/");
    if (isParc) {
      sendJson(
        res,
        200,
        {
          message:
            "L’Assistant PARC n’est pas disponible sur ce service Node (`server.mjs`). " +
            "Sur Onyxia, lancez le service Python : `uvicorn app:app --host 0.0.0.0 --port 5000`, " +
            "avec GRIST_BASE_URL / GRIST_API_KEY / GRIST_DOC_ID_PARC dans le `.env`. " +
            "Vérifiez `GET /health` → `runtime: \"python\"` et `parcConfigured: true`.",
          data: { parc: { unresolved: true, reason: "node_runtime" } },
        },
        origin,
      );
      return;
    }

    try {
      const message = await callLiteLlm(question, body.context);
      // `data` réservé aux tableaux / graphiques (#144) — null en V0 texte.
      sendJson(res, 200, { message, data: null }, origin);
    } catch (e) {
      if (e.code === "litellm_not_configured") {
        sendJson(
          res,
          503,
          {
            error: "litellm_not_configured",
            message:
              "Service d’essai : LiteLLM n’est pas configuré (LITELLM_BASE_URL / LITELLM_API_KEY).",
          },
          origin,
        );
        return;
      }
      console.error("[ask]", e.code || e.message, e.detail || "");
      sendJson(
        res,
        502,
        {
          error: "litellm_upstream",
          message: "Le service de modèles a renvoyé une erreur. Réessayez plus tard.",
        },
        origin,
      );
    }
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "Route inconnue." }, origin);
});

server.listen(PORT, () => {
  console.log(
    `[assistant-essai] http://0.0.0.0:${PORT}  litellm=${Boolean(LITELLM_BASE_URL && LITELLM_API_KEY)}  auth=${Boolean(SHARED_SECRET)}`,
  );
});
