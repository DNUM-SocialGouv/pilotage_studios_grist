/**
 * E-mail de l’utilisateur Grist connecté (session iframe).
 * Jeton court `getAccessToken` — pas de clé API dans le bundle.
 */

import { getGristAccessToken } from "./gristAccessToken.ts";

/** Décode le payload d’un JWT sans vérifier la signature (e-mail session uniquement). */
export function emailFromJwtPayload(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    return null;
  }
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as Record<string, unknown>;
    for (const key of ["email", "Email", "userEmail", "preferred_username"]) {
      const v = json[key];
      if (typeof v === "string" && v.includes("@")) {
        return v.trim().toLowerCase();
      }
    }
    const sub = json.sub;
    if (typeof sub === "string" && sub.includes("@")) {
      return sub.trim().toLowerCase();
    }
  } catch {
    return null;
  }
  return null;
}

async function emailFromProfileApi(baseUrl: string, token: string): Promise<string | null> {
  // baseUrl ≈ …/api/docs/{docId} → remonter à …/api/profile/user
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }
  const url = `${origin}/api/profile/user`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as { email?: string };
    if (typeof body.email === "string" && body.email.includes("@")) {
      return body.email.trim().toLowerCase();
    }
  } catch {
    return null;
  }
  return null;
}

/** E-mail du compte Grist de la session widget. */
export async function resolveGristUserEmail(): Promise<string> {
  const { token, baseUrl } = await getGristAccessToken(true);
  const fromJwt = emailFromJwtPayload(token);
  if (fromJwt) {
    return fromJwt;
  }
  const fromProfile = await emailFromProfileApi(baseUrl, token);
  if (fromProfile) {
    return fromProfile;
  }
  throw new Error(
    "Impossible de déterminer votre e-mail Grist pour créer le profil d’accès.",
  );
}
