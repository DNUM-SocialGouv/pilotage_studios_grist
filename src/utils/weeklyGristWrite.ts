/**
 * Écritures satellite Weekly (`Weekly_phase`, `Weekly_agenda`) via plugin API.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  WEEKLY_AGENDA_TABLE_ID,
  WEEKLY_PHASE_TABLE_ID,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
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

/**
 * Upsert phase + champs ops satellite
 * (`Meteo` / `Note_ops` / `Membre_equipe` Ref → Equipe).
 * Refuse d’écrire les champs ops si `WEEKLY_PHASE_OPS_COLUMNS_READY` est faux
 * (évite une écriture inventée vers `Missions` ou des colonnes absentes).
 */
export async function upsertWeeklyPhaseSuivi(input: {
  phaseRowId: number | null;
  missionId: number;
  phase: WeeklyPhaseKey;
  meteo: string;
  noteOps: string;
  /** Id `Equipe` ; null détache. */
  membreEquipeId: number | null;
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
    Membre_equipe:
      input.membreEquipeId != null && input.membreEquipeId > 0
        ? input.membreEquipeId
        : null,
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

export async function updateWeeklyAgendaTraite(
  id: number,
  traite: boolean,
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_AGENDA_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant sujet invalide.");
  }
  await getWritableTable(WEEKLY_AGENDA_TABLE_ID).update({
    id,
    fields: { Traite: traite },
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
