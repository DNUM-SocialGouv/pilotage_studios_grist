/**
 * Helpers agenda Weekly Ops (`Weekly_agenda`).
 *
 * Auteur prérempli : prénom seul —
 * 1) `Equipe.Prenom_Nom` (session) → premier mot via `firstNameFromDisplayName`
 * 2) sinon e-mail session → segment avant le premier `.` / `_` / `-` (pas `prenom.nom`)
 */

import { formatGristDate } from "./formatGristDate.ts";
import { firstNameFromDisplayName } from "./welcomeHomeByRole.ts";

/** Prénom depuis la partie locale d’un e-mail (`olivier.toumsy` → `Olivier`). */
export function prenomFromEmailLocalPart(
  email: string | null | undefined,
): string | null {
  const local = email?.split("@")[0]?.trim() ?? "";
  if (!local) return null;
  const first = local.split(/[._-]/)[0]?.trim() ?? "";
  if (!first) return null;
  return first.charAt(0).toLocaleUpperCase("fr-FR") + first.slice(1);
}

/**
 * Valeur par défaut du champ « Votre prénom (auteur) ».
 * Priorité : fiche Équipe (`displayName`) puis parse e-mail session.
 */
export function defaultWeeklyAuteurPrenom(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  return (
    firstNameFromDisplayName(displayName) ??
    prenomFromEmailLocalPart(email) ??
    ""
  );
}

/** Parse `Weekly_agenda.Cree_le` → Date locale, ou null. */
export function parseWeeklyAgendaCreatedAt(
  value: string | number | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
    return new Date(value * 1000);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber > 1_000_000_000) {
    return new Date(asNumber * 1000);
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

/**
 * Affiche `Weekly_agenda.Cree_le` (DATETIME Grist en secondes, ou ISO string).
 */
export function formatWeeklyAgendaCreatedAt(
  value: string | number | null | undefined,
): string {
  const date = parseWeeklyAgendaCreatedAt(value);
  if (!date) return "";
  const label = formatGristDate(date.getTime() / 1000);
  return label === "—" ? "" : label;
}
