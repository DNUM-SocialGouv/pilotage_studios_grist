/**
 * Helpers purs — actions Weekly Ops (`Weekly_action`).
 * Valeurs Choice figées sur le schéma Grist (espaces) : `A faire` · `En cours`.
 */

/** Valeurs stockées dans `Weekly_action.Statut` (Choice Grist). */
export const WEEKLY_ACTION_STATUT = {
  A_FAIRE: "A faire",
  EN_COURS: "En cours",
} as const;

export type WeeklyActionStatut =
  (typeof WEEKLY_ACTION_STATUT)[keyof typeof WEEKLY_ACTION_STATUT];

const STATUT_BY_NORMALIZED: Record<string, WeeklyActionStatut> = {
  "a faire": WEEKLY_ACTION_STATUT.A_FAIRE,
  "à faire": WEEKLY_ACTION_STATUT.A_FAIRE,
  a_faire: WEEKLY_ACTION_STATUT.A_FAIRE,
  "en cours": WEEKLY_ACTION_STATUT.EN_COURS,
  en_cours: WEEKLY_ACTION_STATUT.EN_COURS,
};

/**
 * Normalise une valeur lue (Choice / texte) vers le Choice Grist.
 * Inconnu / vide → `A faire` (défaut create).
 */
export function normalizeWeeklyActionStatut(
  value: unknown,
): WeeklyActionStatut {
  if (typeof value !== "string") {
    return WEEKLY_ACTION_STATUT.A_FAIRE;
  }
  const trimmed = value.trim();
  if (!trimmed) return WEEKLY_ACTION_STATUT.A_FAIRE;
  if (
    trimmed === WEEKLY_ACTION_STATUT.A_FAIRE ||
    trimmed === WEEKLY_ACTION_STATUT.EN_COURS
  ) {
    return trimmed;
  }
  const key = trimmed.toLowerCase().normalize("NFC");
  return STATUT_BY_NORMALIZED[key] ?? WEEKLY_ACTION_STATUT.A_FAIRE;
}

/**
 * Timestamp Grist Date (secondes) pour le jour calendaire local de `now`.
 * Colonnes `Fait_le` / `Weekly_du` / `Cree_le` / `Date_fin` (type Date).
 */
export function weeklyActionDateTimestamp(now: Date = new Date()): number {
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.floor(localMidnight.getTime() / 1000);
}

/** Alias métier : horodatage du coche `Fait` (miroir `Traite_le`). */
export function weeklyActionFaitLeTimestamp(now: Date = new Date()): number {
  return weeklyActionDateTimestamp(now);
}

/**
 * Champs create inline (fondations — pas d’UI encore).
 * `Weekly_du` / `Cree_le` = jour local du create ; `Statut` défaut `A faire`.
 */
export function buildWeeklyActionCreateFields(input: {
  titre: string;
  porteurId: number | null;
  missionId?: number | null;
  dateFin?: Date | null;
  notes?: string;
  email?: string;
  statut?: WeeklyActionStatut;
  now?: Date;
}): Record<string, unknown> {
  const titre = input.titre.trim();
  if (!titre) {
    throw new Error("Le titre de l’action ne peut pas être vide.");
  }
  const now = input.now ?? new Date();
  const dayTs = weeklyActionDateTimestamp(now);
  const dateFin =
    input.dateFin != null ? weeklyActionDateTimestamp(input.dateFin) : null;
  return {
    Titre: titre,
    Statut: normalizeWeeklyActionStatut(
      input.statut ?? WEEKLY_ACTION_STATUT.A_FAIRE,
    ),
    Porteur:
      input.porteurId != null && input.porteurId > 0 ? input.porteurId : null,
    Mission:
      input.missionId != null && input.missionId > 0 ? input.missionId : null,
    Date_fin: dateFin,
    Weekly_du: dayTs,
    Notes: (input.notes ?? "").trim(),
    Fait: false,
    Fait_le: null,
    Cree_le: dayTs,
    Email: (input.email ?? "").trim(),
  };
}

/**
 * Champs update pour coche / décoche `Fait` (+ sync `Fait_le`).
 */
export function buildWeeklyActionFaitFields(
  fait: boolean,
  now: Date = new Date(),
): { Fait: boolean; Fait_le: number | null } {
  return {
    Fait: fait,
    Fait_le: fait ? weeklyActionFaitLeTimestamp(now) : null,
  };
}
