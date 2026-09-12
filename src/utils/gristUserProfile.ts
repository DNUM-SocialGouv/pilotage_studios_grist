/**
 * Identité utilisateur Grist via jeton court + GET /api/profile/user.
 * Pas de clé API dans le bundle.
 */

import { getGristAccessToken } from "./gristAccessToken.ts";

export type GristUserProfile = {
  name: string;
  email: string;
};

const FALLBACK: GristUserProfile = {
  name: "Utilisateur Grist",
  email: "",
};

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

/**
 * Charge le profil de l’utilisateur connecté (session iframe Grist).
 * En échec : fallback « Utilisateur Grist » (dev hors iframe, token refusé, etc.).
 */
export async function fetchGristUserProfile(): Promise<GristUserProfile> {
  try {
    const { token, baseUrl } = await getGristAccessToken(true);
    const profileUrl = new URL(profileUserUrlFromDocBaseUrl(baseUrl));
    profileUrl.searchParams.set("auth", token);

    const response = await fetch(profileUrl.toString());
    if (!response.ok) {
      return FALLBACK;
    }

    const data = (await response.json()) as ProfileJson;
    const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : FALLBACK.name;
    const email = typeof data.email === "string" ? data.email.trim() : "";
    return { name, email };
  } catch {
    return FALLBACK;
  }
}
