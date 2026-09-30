/**
 * Accès Weekly coachs (couche 5) : Admin / Resp. + e-mails présents dans
 * la table Grist `Weekly_coachs` (lecture runtime — pas d’e-mails dans le repo).
 */

import { isMonCarnetManagerRole } from "./droitsPagesThemes.ts";

export function normalizeWeeklyCoachEmail(
  email: string | null | undefined,
): string {
  return (email ?? "").trim().toLowerCase();
}

/** Construit l’ensemble d’e-mails normalisés depuis les lignes `Weekly_coachs`. */
export function weeklyCoachEmailSetFromRows(
  rows: readonly { E_mail?: string | null }[],
): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const n = normalizeWeeklyCoachEmail(row.E_mail);
    if (n) set.add(n);
  }
  return set;
}

/**
 * Qui peut ouvrir `/weekly` (nav + garde).
 * Admin / Responsable : oui. Freelance : e-mail dans `coachEmails`. Invité : non.
 * `coachEmails` = contenu lu depuis Grist (`Weekly_coachs`) ; ensemble vide → Freelance refusé.
 */
export function canAccessWeeklyCoach(input: {
  role: string | null | undefined;
  email: string | null | undefined;
  coachEmails: ReadonlySet<string>;
}): boolean {
  if (isMonCarnetManagerRole(input.role)) return true;
  const role = (input.role ?? "").trim();
  if (role !== "Freelance") return false;
  const n = normalizeWeeklyCoachEmail(input.email);
  return n.length > 0 && input.coachEmails.has(n);
}
