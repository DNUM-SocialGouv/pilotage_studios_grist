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

/**
 * Options « Membre équipe » du drawer Weekly : personnes `Equipe` dont l’e-mail
 * normalisé ∈ `Weekly_coachs` (même pool que l’accès écran).
 * Les orphelins déjà assignés hors liste sont ajoutés côté drawer.
 */
export function weeklyOpsMembreOptions(
  intervenants: readonly {
    id: number;
    Prenom_Nom?: string | null;
    E_mail?: string | null;
  }[],
  coachEmails: ReadonlySet<string>,
): { id: number; label: string }[] {
  return intervenants
    .filter((p) => {
      const email = normalizeWeeklyCoachEmail(p.E_mail);
      return email.length > 0 && coachEmails.has(email);
    })
    .map((p) => ({
      id: p.id,
      label: (p.Prenom_Nom ?? "").trim() || `Personne #${p.id}`,
    }))
    .filter((p) => p.label.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
