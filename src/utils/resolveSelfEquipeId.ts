/**
 * Résout la fiche Equipe du compte Grist connecté (e-mail session ↔ Equipe.E_mail).
 * Prérequis ACL : lecture de E_mail sur sa propre ligne (HITL #33 — deny hors soi).
 *
 * Préférer `sessionEmail` depuis `Acl_profil.E_mail` : le jeton `getAccessToken`
 * n’expose souvent pas l’e-mail (même constat que le feedback).
 */

import type { GristFetchTableResult } from "../gristTypes.ts";
import { asGristChoice } from "./gristReferences.ts";
import { resolveGristUserEmail } from "./gristUserEmail.ts";

function asReadableText(value: unknown): string {
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t === "CENSORED" || t === "...") {
      return "";
    }
    return t;
  }
  const choice = asGristChoice(value);
  return choice?.trim() ?? "";
}

export type SelfEquipeIdentity = {
  id: number;
  prenomNom: string;
  /** Département / studio (`Equipe.Equipe`) — pour peupler Realise.Equipe. */
  equipeLabel: string;
  email: string;
  /** Seed DiceBear (`Equipe.Avatar`), optionnel. */
  avatar?: string;
  /**
   * Tarif journalier (`Equipe.TJM`) — seulement si Access Rules le livrent
   * (soi / Admin / Owner). Sinon absent → masqué dans le bandeau.
   */
  tjm?: number;
};

function asReadableNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t === "CENSORED" || t === "..." || t.startsWith("[Pending")) {
      return undefined;
    }
    const n = Number(t.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Parmi les lignes Equipe visibles, trouve celle dont l’e-mail = compte connecté.
 * Retourne null si aucune correspondance (e-mail illisible / manquant / pas de fiche).
 */
export function findSelfEquipeFromTable(
  table: GristFetchTableResult,
  sessionEmail: string,
): SelfEquipeIdentity | null {
  const want = sessionEmail.trim().toLowerCase();
  if (!want.includes("@")) {
    return null;
  }
  const ids = table.id;
  if (!Array.isArray(ids)) {
    return null;
  }
  const emails = Array.isArray(table.E_mail) ? table.E_mail : [];
  const noms = Array.isArray(table.Prenom_Nom) ? table.Prenom_Nom : [];
  const equipes = Array.isArray(table.Equipe) ? table.Equipe : [];
  const avatars = Array.isArray(table.Avatar) ? table.Avatar : [];
  const tjms = Array.isArray(table.TJM) ? table.TJM : [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) {
      continue;
    }
    const email = asReadableText(emails[i]).toLowerCase();
    if (!email || email !== want) {
      continue;
    }
    const avatar = asReadableText(avatars[i]);
    const tjm = asReadableNumber(tjms[i]);
    return {
      id,
      prenomNom: asReadableText(noms[i]) || `Intervenant #${id}`,
      equipeLabel: asReadableText(equipes[i]),
      email,
      avatar: avatar || undefined,
      ...(tjm != null ? { tjm } : {}),
    };
  }
  return null;
}

/**
 * E-mail session : préfère `Acl_profil.E_mail` (ou e-mail déjà résolu),
 * sinon jeton / profil Grist.
 */
export async function resolveGristUserEmailForSelf(
  preferred?: string | null,
): Promise<string> {
  const fromPreferred = preferred?.trim().toLowerCase() ?? "";
  if (fromPreferred.includes("@")) {
    return fromPreferred;
  }
  try {
    return await resolveGristUserEmail();
  } catch {
    throw new Error(
      "Impossible de déterminer votre e-mail de session (fiche d’accès sans e-mail, et jeton Grist sans profil). Rechargez le widget ou demandez à un Admin de vérifier Acl_profil.",
    );
  }
}

/** Charge l’identité Equipe du compte connecté via fetchTable allowlisté. */
export async function resolveSelfEquipeIdentity(
  fetchEquipe: () => Promise<GristFetchTableResult>,
  sessionEmail?: string | null,
): Promise<SelfEquipeIdentity> {
  const email = await resolveGristUserEmailForSelf(sessionEmail);
  const table = await fetchEquipe();
  const found = findSelfEquipeFromTable(table, email);
  if (!found) {
    throw new Error(
      "Impossible de retrouver votre fiche Équipe (e-mail du compte ≠ Equipe.E_mail, ou e-mail illisible). Demandez à un Owner d’aligner l’e-mail et de corriger la règle Access Rules E_mail (refus hors soi, comme pour le TJM).",
    );
  }
  return found;
}
