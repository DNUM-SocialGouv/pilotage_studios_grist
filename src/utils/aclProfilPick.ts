/**
 * Sélection de la fiche `Acl_profil` de session.
 * Quand plusieurs lignes sont visibles, on privilégie l’e-mail du jeton
 * plutôt que le plus petit id.
 *
 * « Voir en tant que » ne change pas le jeton : il reste le compte qui a
 * ouvert le navigateur. Chacun, hors propriétaire du document, ne voit que
 * sa fiche : le widget la prend. Le propriétaire voit toutes les fiches ;
 * le jeton désigne alors la sienne.
 */

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
