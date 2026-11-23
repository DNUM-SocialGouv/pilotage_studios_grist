/**
 * Sélection de la fiche `Acl_profil` de session.
 * Quand plusieurs lignes sont visibles, on privilégie l’e-mail de session
 * plutôt que le plus petit id.
 *
 * « Voir en tant que » : le jeton reste le compte qui a ouvert le navigateur.
 * Une formule de colonne ne reçoit pas `user` (NameError sur `user.Email`).
 * Si une seule fiche est visible (freelance), on la prend. Si un admin en voit
 * plusieurs, le jeton désigne le testeur — d’où « Bonjour » à son prénom.
 * `Email_session`, si elle existe un jour et porte un e-mail lisible, est
 * préférée au jeton.
 */

/** Colonne optionnelle : e-mail de la personne affichée, si Grist sait le fournir. */
export const ACL_SESSION_EMAIL_FIELD = "Email_session";

function normalizeSessionEmail(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const t = raw.trim().toLowerCase();
  if (!t || !t.includes("@") || t === "censored") {
    return null;
  }
  return t;
}

export function emailFromAclProfilFields(
  fields: Record<string, unknown>,
): string | null {
  return normalizeSessionEmail(fields.E_mail);
}

/**
 * E-mail de la personne affichée, lu sur la formule `Email_session`.
 * Toutes les lignes visibles portent la même valeur (`user.Email`).
 * Absente, censurée ou incohérente → null (on garde alors le jeton).
 */
export function sessionEmailFromAclRows(
  rows: Array<Record<string, unknown>>,
): string | null {
  const found = new Set<string>();
  for (const row of rows) {
    const email = normalizeSessionEmail(row[ACL_SESSION_EMAIL_FIELD]);
    if (email) {
      found.add(email);
    }
  }
  if (found.size !== 1) {
    return null;
  }
  return [...found][0] ?? null;
}

/**
 * Personne affichée (formule, y compris « Voir en tant que ») sinon jeton navigateur.
 */
export function preferEffectiveSessionEmail(
  tokenEmail: string | null | undefined,
  rows: Array<Record<string, unknown>>,
): string | null {
  return sessionEmailFromAclRows(rows) ?? normalizeSessionEmail(tokenEmail);
}

/**
 * @param preferredEmail e-mail session (jeton / profil) — prioritaire si présent dans les lignes
 * @returns la ligne matchée, ou la seule ligne visible, ou la plus ancienne en dernier recours
 */
export function pickAclProfilRow(
  rows: Array<Record<string, unknown> & { id: number }>,
  preferredEmail?: string | null,
): (Record<string, unknown> & { id: number }) | null {
  if (rows.length === 0) {
    return null;
  }
  const want = preferredEmail?.trim().toLowerCase() ?? "";
  if (want.includes("@")) {
    const match = rows.find((r) => emailFromAclProfilFields(r) === want);
    if (match) {
      return match;
    }
  }
  if (rows.length === 1) {
    return rows[0] ?? null;
  }
  return [...rows].sort((a, b) => a.id - b.id)[0] ?? null;
}
