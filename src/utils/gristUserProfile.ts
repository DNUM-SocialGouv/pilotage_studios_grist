/**
 * Identité utilisateur Grist pour le widget feedback.
 *
 * Le jeton `getAccessToken` + `/api/profile/user` renvoie souvent « Anonymous »
 * (jeton doc sans scope profil). On sonde donc `user.Name` / `user.Email` via
 * trigger formulas sur `Feedback_Identite` : create (plugin API = vrai user) →
 * fetchTable → destroy.
 */

import { fetchAllowlistedTable } from "../security/fetchTableAllowlist.ts";
import {
  FEEDBACK_IDENTITE_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";
import { getGristAccessToken } from "./gristAccessToken.ts";

export type GristUserProfile = {
  name: string;
  email: string;
};

const FALLBACK: GristUserProfile = {
  name: "Utilisateur Grist",
  email: "",
};

const ANON_NAMES = new Set(["anonymous", "anon", ""]);
const ANON_EMAILS = new Set(["anon@getgrist.com", ""]);

/** True si le nom est utilisable en UI (pas Anonymous / vide). */
export function isUsableDisplayName(name: string): boolean {
  return !ANON_NAMES.has(name.trim().toLowerCase());
}

export function isUsableEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return e.length > 0 && !ANON_EMAILS.has(e);
}

export function normalizeProfile(name: string, email: string): GristUserProfile | null {
  const n = name.trim();
  const e = email.trim();
  if (!isUsableDisplayName(n)) {
    return null;
  }
  return { name: n, email: isUsableEmail(e) ? e : "" };
}

/**
 * Déduit l’URL `/api/profile/user` depuis le `baseUrl` du jeton doc
 * (ex. `https://host/api/docs/DOCID` → `https://host/api/profile/user`).
 */
export function profileUserUrlFromDocBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/$/, "");
  const docsIdx = normalized.indexOf("/api/docs/");
  if (docsIdx >= 0) {
    return `${normalized.slice(0, docsIdx)}/api/profile/user`;
  }
  try {
    const url = new URL(normalized);
    return `${url.origin}/api/profile/user`;
  } catch {
    throw new Error("baseUrl getAccessToken invalide pour dériver /api/profile/user");
  }
}

type ProfileJson = {
  name?: unknown;
  email?: unknown;
};

function cellAt(
  table: Record<string, unknown[]>,
  column: string,
  index: number,
): string {
  const col = table[column];
  if (!Array.isArray(col) || index < 0 || index >= col.length) {
    return "";
  }
  const raw = col[index];
  return typeof raw === "string" ? raw : raw == null ? "" : String(raw);
}

/**
 * Sonde d’identité : create d’une ligne `Feedback_Identite` (triggers user.*) puis lecture.
 */
export async function probeGristUserViaIdentiteTable(): Promise<GristUserProfile | null> {
  assertWritableTableId(FEEDBACK_IDENTITE_TABLE_ID);
  const grist = window.grist;
  if (!grist?.getTable) {
    return null;
  }

  const tableOps = grist.getTable(FEEDBACK_IDENTITE_TABLE_ID);
  const created = await tableOps.create({
    fields: { Note: "probe" },
  });
  const first = Array.isArray(created) ? created[0] : created;
  const rowId =
    first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(rowId) || rowId <= 0) {
    return null;
  }

  try {
    const data = await fetchAllowlistedTable(FEEDBACK_IDENTITE_TABLE_ID);
    const ids = data.id;
    if (!Array.isArray(ids)) {
      return null;
    }
    const index = ids.indexOf(rowId);
    if (index < 0) {
      return null;
    }
    return normalizeProfile(cellAt(data, "Nom", index), cellAt(data, "Email", index));
  } finally {
    try {
      await tableOps.destroy?.(rowId);
    } catch {
      // Sonde : on ignore l’échec de nettoyage.
    }
  }
}

async function fetchProfileViaAccessToken(): Promise<GristUserProfile | null> {
  try {
    const { token, baseUrl } = await getGristAccessToken(true);
    const profileUrl = new URL(profileUserUrlFromDocBaseUrl(baseUrl));
    profileUrl.searchParams.set("auth", token);

    const response = await fetch(profileUrl.toString());
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ProfileJson;
    const name = typeof data.name === "string" ? data.name : "";
    const email = typeof data.email === "string" ? data.email : "";
    return normalizeProfile(name, email);
  } catch {
    return null;
  }
}

/**
 * Charge le profil de l’utilisateur connecté (session iframe Grist).
 * Priorité : sonde trigger `Feedback_Identite`, puis `/api/profile/user` (souvent Anonymous).
 */
export async function fetchGristUserProfile(): Promise<GristUserProfile> {
  const fromProbe = await probeGristUserViaIdentiteTable().catch(() => null);
  if (fromProbe) {
    return fromProbe;
  }

  const fromToken = await fetchProfileViaAccessToken();
  if (fromToken) {
    return fromToken;
  }

  return FALLBACK;
}
