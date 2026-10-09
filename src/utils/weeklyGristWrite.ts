/**
 * Écritures satellite Weekly (`Weekly_phase`, `Weekly_agenda`, `Weekly_action`)
 * via plugin API.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  WEEKLY_ACTION_TABLE_ID,
  WEEKLY_AGENDA_TABLE_ID,
  WEEKLY_PHASE_TABLE_ID,
  assertWritableDeleteTableId,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  buildWeeklyActionColumnMoveFields,
  buildWeeklyActionCreateFields,
  buildWeeklyActionFaitFields,
  isWeeklyActionColumnKey,
  normalizeWeeklyActionStatut,
  type WeeklyActionColumnKey,
  type WeeklyActionStatut,
  weeklyActionDateTimestamp,
} from "./weeklyAction.ts";
import {
  WEEKLY_PHASE_OPS_COLUMNS_READY,
  type WeeklyPhaseKey,
} from "./weeklyPhases.ts";

/**
 * Colonne Grist `Weekly_agenda.Detail` (TEXT) — confirmée MCP doc `nei9DeARs5Eo`
 * (id `Detail`, type TEXT). Lecture + écriture actives.
 */
export const WEEKLY_AGENDA_DETAIL_COLUMN_READY = true;

export { WEEKLY_PHASE_OPS_COLUMNS_READY };

function parseCreateId(result: GristTableCreateResult): number {
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création Grist : réponse sans id valide.");
  }
  return id;
}

function getWritableTable(tableId: string) {
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  return grist.getTable(tableId);
}

/** Create ou update la phase d’une mission (1 ligne max par mission côté usage). */
export async function upsertWeeklyPhase(input: {
  phaseRowId: number | null;
  missionId: number;
  phase: WeeklyPhaseKey;
}): Promise<number> {
  assertWritableTableId(WEEKLY_PHASE_TABLE_ID);
  assertWritableUpdateTableId(WEEKLY_PHASE_TABLE_ID);

  if (input.phaseRowId != null && input.phaseRowId > 0) {
    await getWritableTable(WEEKLY_PHASE_TABLE_ID).update({
      id: input.phaseRowId,
      fields: { Phase: input.phase },
    });
    return input.phaseRowId;
  }

  const result = await getWritableTable(WEEKLY_PHASE_TABLE_ID).create({
    fields: {
      Mission: input.missionId,
      Phase: input.phase,
    },
  });
  return parseCreateId(result);
}

/** Payload RefList Grist `["L", id…]` ; `null` si vide. */
export function buildMembreEquipeRefList(
  ids: readonly number[],
): ["L", ...number[]] | null {
  const seen = new Set<number>();
  const unique: number[] = [];
  for (const raw of ids) {
    if (!Number.isFinite(raw)) continue;
    const id = Math.trunc(raw);
    if (id <= 0 || seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  if (unique.length === 0) return null;
  return ["L", ...unique];
}

/**
 * Upsert phase + champs ops satellite
 * (`Meteo` / `Note_ops` / `Membre_equipe` RefList → Equipe).
 * Refuse d’écrire les champs ops si `WEEKLY_PHASE_OPS_COLUMNS_READY` est faux
 * (évite une écriture inventée vers `Missions` ou des colonnes absentes).
 */
export async function upsertWeeklyPhaseSuivi(input: {
  phaseRowId: number | null;
  missionId: number;
  phase: WeeklyPhaseKey;
  meteo: string;
  noteOps: string;
  /** Ids `Equipe` ; tableau vide détache. */
  membreEquipeIds: readonly number[];
}): Promise<number> {
  assertWritableTableId(WEEKLY_PHASE_TABLE_ID);
  assertWritableUpdateTableId(WEEKLY_PHASE_TABLE_ID);

  if (!WEEKLY_PHASE_OPS_COLUMNS_READY) {
    return upsertWeeklyPhase({
      phaseRowId: input.phaseRowId,
      missionId: input.missionId,
      phase: input.phase,
    });
  }

  const fields: Record<string, unknown> = {
    Phase: input.phase,
    Meteo: input.meteo.trim(),
    Note_ops: input.noteOps.trim(),
    Membre_equipe: buildMembreEquipeRefList(input.membreEquipeIds),
  };

  if (input.phaseRowId != null && input.phaseRowId > 0) {
    await getWritableTable(WEEKLY_PHASE_TABLE_ID).update({
      id: input.phaseRowId,
      fields,
    });
    return input.phaseRowId;
  }

  const result = await getWritableTable(WEEKLY_PHASE_TABLE_ID).create({
    fields: {
      Mission: input.missionId,
      ...fields,
    },
  });
  return parseCreateId(result);
}

export async function createWeeklyAgendaRecord(input: {
  /** Titre (`Weekly_agenda.Texte`). */
  texte: string;
  /** Détail optionnel (`Weekly_agenda.Detail`). */
  detail?: string;
  auteur: string;
  email: string;
  missionId: number | null;
}): Promise<number> {
  assertWritableTableId(WEEKLY_AGENDA_TABLE_ID);
  const texte = input.texte.trim();
  if (!texte) {
    throw new Error("Le titre du sujet ne peut pas être vide.");
  }
  const fields: Record<string, unknown> = {
    Texte: texte,
    Auteur: input.auteur.trim(),
    Email: input.email.trim(),
    Traite: false,
    Cree_le: new Date().toISOString(),
    Mission:
      input.missionId != null && input.missionId > 0 ? input.missionId : null,
  };
  if (WEEKLY_AGENDA_DETAIL_COLUMN_READY) {
    fields.Detail = (input.detail ?? "").trim();
  }
  const result = await getWritableTable(WEEKLY_AGENDA_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

/**
 * Timestamp Grist Date (secondes) pour le jour calendaire local de `now`.
 * Colonne `Weekly_agenda.Traite_le` (Date) — pas DateTime.
 */
export function weeklyAgendaTraiteLeTimestamp(
  now: Date = new Date(),
): number {
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.floor(localMidnight.getTime() / 1000);
}

/**
 * Coche / décoche `Traite` et synchronise `Traite_le` (jour du coche, ou null).
 */
export async function updateWeeklyAgendaTraite(
  id: number,
  traite: boolean,
  now: Date = new Date(),
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_AGENDA_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant sujet invalide.");
  }
  await getWritableTable(WEEKLY_AGENDA_TABLE_ID).update({
    id,
    fields: {
      Traite: traite,
      Traite_le: traite ? weeklyAgendaTraiteLeTimestamp(now) : null,
    },
  });
}

/**
 * Met à jour titre (`Texte`), détail (`Detail`) et mission liée (`Mission`).
 * `missionId` null → détache la mission.
 */
export async function updateWeeklyAgendaSujet(
  id: number,
  input: {
    texte: string;
    detail: string;
    missionId: number | null;
  },
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_AGENDA_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant sujet invalide.");
  }
  const texte = input.texte.trim();
  if (!texte) {
    throw new Error("Le titre du sujet ne peut pas être vide.");
  }
  const fields: Record<string, unknown> = {
    Texte: texte,
    Mission:
      input.missionId != null && input.missionId > 0 ? input.missionId : null,
  };
  if (WEEKLY_AGENDA_DETAIL_COLUMN_READY) {
    fields.Detail = input.detail.trim();
  }
  await getWritableTable(WEEKLY_AGENDA_TABLE_ID).update({ id, fields });
}

/** Create une action Weekly Ops (`Weekly_action`). */
export async function createWeeklyActionRecord(input: {
  titre: string;
  porteurId: number | null;
  missionId?: number | null;
  dateFin?: Date | null;
  weeklyDu?: Date | null;
  notes?: string;
  email?: string;
  statut?: WeeklyActionStatut;
  now?: Date;
}): Promise<number> {
  assertWritableTableId(WEEKLY_ACTION_TABLE_ID);
  const fields = buildWeeklyActionCreateFields(input);
  const result = await getWritableTable(WEEKLY_ACTION_TABLE_ID).create({
    fields,
  });
  return parseCreateId(result);
}

/**
 * Coche / décoche `Fait` et synchronise `Fait_le` (jour du coche, ou null).
 */
export async function updateWeeklyActionFait(
  id: number,
  fait: boolean,
  now: Date = new Date(),
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_ACTION_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant action invalide.");
  }
  await getWritableTable(WEEKLY_ACTION_TABLE_ID).update({
    id,
    fields: buildWeeklyActionFaitFields(fait, now),
  });
}

/**
 * Déplace une action vers une colonne kanban (drag / menu clavier).
 * Colonnes : `a_faire` · `en_cours` · `done`.
 */
export async function updateWeeklyActionColumn(
  id: number,
  columnKey: WeeklyActionColumnKey | string,
  now: Date = new Date(),
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_ACTION_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant action invalide.");
  }
  if (!isWeeklyActionColumnKey(columnKey)) {
    throw new Error("Colonne action invalide.");
  }
  await getWritableTable(WEEKLY_ACTION_TABLE_ID).update({
    id,
    fields: buildWeeklyActionColumnMoveFields(columnKey, now),
  });
}

/**
 * Met à jour les champs d’édition d’une action (drawer — fondations, sans UI).
 */
export async function updateWeeklyActionRecord(
  id: number,
  input: {
    titre: string;
    statut: WeeklyActionStatut | string;
    porteurId: number | null;
    missionId: number | null;
    dateFin: Date | null;
    weeklyDu: Date | null;
    notes: string;
  },
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_ACTION_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant action invalide.");
  }
  const titre = input.titre.trim();
  if (!titre) {
    throw new Error("Le titre de l’action ne peut pas être vide.");
  }
  await getWritableTable(WEEKLY_ACTION_TABLE_ID).update({
    id,
    fields: {
      Titre: titre,
      Statut: normalizeWeeklyActionStatut(input.statut),
      Porteur:
        input.porteurId != null && input.porteurId > 0 ? input.porteurId : null,
      Mission:
        input.missionId != null && input.missionId > 0 ? input.missionId : null,
      Date_fin:
        input.dateFin != null ? weeklyActionDateTimestamp(input.dateFin) : null,
      Weekly_du:
        input.weeklyDu != null
          ? weeklyActionDateTimestamp(input.weeklyDu)
          : null,
      Notes: input.notes.trim(),
    },
  });
}

/**
 * Supprime une action Weekly Ops (`Weekly_action.destroy`).
 * Exception allowlist : seule table avec delete widget ; un id à la fois (pas de masse).
 */
export async function deleteWeeklyAction(id: number): Promise<void> {
  assertWritableDeleteTableId(WEEKLY_ACTION_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant action invalide.");
  }
  const table = getWritableTable(WEEKLY_ACTION_TABLE_ID);
  if (typeof table.destroy !== "function") {
    throw new Error(
      "Suppression Grist indisponible (hors iframe ou API trop ancienne).",
    );
  }
  await table.destroy([id]);
}
