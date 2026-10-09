/**
 * Helpers purs — actions Weekly Ops (`Weekly_action`).
 * Valeurs Choice figées sur le schéma Grist (espaces) : `A faire` · `En cours`.
 */

import type { WeeklyActionRow } from "../types.ts";
import { parseWeeklyAgendaDateValue } from "./weeklyAgenda.ts";
import { normalizeWeeklyCoachEmail } from "./weeklyCoachAccess.ts";

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

/** Liste « Actions en cours » : uniquement les non faites. */
export function filterWeeklyActionsEnCours(
  actions: readonly WeeklyActionRow[],
): WeeklyActionRow[] {
  return actions.filter((a) => !a.Fait);
}

/** Tri : date de fin croissante (sans date en dernier), puis id. */
export function sortWeeklyActionsEnCours(
  actions: readonly WeeklyActionRow[],
): WeeklyActionRow[] {
  return [...actions].sort((a, b) => {
    const da = parseWeeklyActionDate(a.Date_fin);
    const db = parseWeeklyActionDate(b.Date_fin);
    if (da == null && db == null) return a.id - b.id;
    if (da == null) return 1;
    if (db == null) return -1;
    const diff = da.getTime() - db.getTime();
    return diff !== 0 ? diff : a.id - b.id;
  });
}

export function parseWeeklyActionDate(
  value: string | number | null | undefined,
): Date | null {
  return parseWeeklyAgendaDateValue(value);
}

/** Défaut confort create : +7 jours calendaires. */
export function defaultWeeklyActionDateFin(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
}

/** Valeur `<input type="date">` locale `YYYY-MM-DD`. */
export function toLocalDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseLocalDateInputValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  return new Date(y, mo - 1, d);
}

/** Libellé UI statut (accent sur « À faire »). */
export function weeklyActionStatutLabel(
  statut: string | undefined,
): string {
  return normalizeWeeklyActionStatut(statut) === WEEKLY_ACTION_STATUT.EN_COURS
    ? "En cours"
    : "À faire";
}

/** Date de fin dépassée (jour local) et action non faite. */
export function isWeeklyActionDateFinOverdue(
  dateFin: Date | null,
  now: Date = new Date(),
  fait = false,
): boolean {
  if (fait || dateFin == null) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fin = new Date(
    dateFin.getFullYear(),
    dateFin.getMonth(),
    dateFin.getDate(),
  );
  return fin.getTime() < today.getTime();
}

/** Libellé court « JJ/MM » (liste). */
export function formatWeeklyActionDayShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}`;
}

/**
 * Porteur prérempli session : match e-mail → fiche `Equipe`
 * (même logique que jointure coachs).
 */
export function matchWeeklyActionPorteurId(
  intervenants: readonly {
    id: number;
    E_mail?: string | null;
  }[],
  sessionEmail: string | null | undefined,
): number | null {
  const n = normalizeWeeklyCoachEmail(sessionEmail);
  if (!n) return null;
  const found = intervenants.find(
    (p) => normalizeWeeklyCoachEmail(p.E_mail) === n,
  );
  return found != null && found.id > 0 ? found.id : null;
}
