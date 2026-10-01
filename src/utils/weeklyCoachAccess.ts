/**
 * Accès Weekly : uniquement les e-mails présents dans Grist `Weekly_coachs`
 * (lecture runtime — pas d’e-mails dans le repo). Aucun rôle (Admin inclus)
 * n’ouvre la page sans figurer dans cette table.
 */

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
 * Critère unique : e-mail de session ∈ `coachEmails` (table `Weekly_coachs`).
 */
export function canAccessWeeklyCoach(input: {
  email: string | null | undefined;
  coachEmails: ReadonlySet<string>;
}): boolean {
  const n = normalizeWeeklyCoachEmail(input.email);
  return n.length > 0 && input.coachEmails.has(n);
}
