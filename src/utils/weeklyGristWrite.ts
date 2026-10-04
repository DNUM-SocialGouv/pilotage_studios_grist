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
import type { WeeklyPhaseKey } from "./weeklyPhases.ts";

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

export async function createWeeklyAgendaRecord(input: {
  texte: string;
  auteur: string;
  email: string;
  missionId: number | null;
}): Promise<number> {
  assertWritableTableId(WEEKLY_AGENDA_TABLE_ID);
  const texte = input.texte.trim();
  if (!texte) {
    throw new Error("Le sujet ne peut pas être vide.");
  }
  const fields: Record<string, unknown> = {
    Texte: texte,
    Auteur: input.auteur.trim(),
    Email: input.email.trim(),
    Traite: false,
    Cree_le: new Date().toISOString(),
  };
  if (input.missionId != null && input.missionId > 0) {
    fields.Mission = input.missionId;
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

/** Met à jour le texte d’un sujet (`Weekly_agenda.Texte`) — pas d’autres colonnes. */
export async function updateWeeklyAgendaTexte(
  id: number,
  texte: string,
): Promise<void> {
  assertWritableUpdateTableId(WEEKLY_AGENDA_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant sujet invalide.");
  }
  const next = texte.trim();
  if (!next) {
    throw new Error("Le sujet ne peut pas être vide.");
  }
  await getWritableTable(WEEKLY_AGENDA_TABLE_ID).update({
    id,
    fields: { Texte: next },
  });
}
