/**
 * Create / update lignes `Equipe_TJM` via plugin API.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  EQUIPE_TJM_TABLE_ID,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import type { EquipeTjmWriteFields } from "./equipeTjm.ts";

function parseCreateId(result: GristTableCreateResult): number {
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création tarif : réponse sans id valide.");
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

export async function createEquipeTjmRecord(fields: EquipeTjmWriteFields): Promise<number> {
  assertWritableTableId(EQUIPE_TJM_TABLE_ID);
  const payload: Record<string, unknown> = {
    Personne: fields.Personne,
    Specialite: fields.Specialite,
    TJM: fields.TJM,
    Date_debut: fields.Date_debut,
  };
  if (fields.Date_fin === null) {
    payload.Date_fin = null;
  } else if (fields.Date_fin != null) {
    payload.Date_fin = fields.Date_fin;
  }
  if (fields.Commentaire !== undefined) {
    payload.Commentaire = fields.Commentaire;
  }
  const result = await getWritableTable(EQUIPE_TJM_TABLE_ID).create({ fields: payload });
  return parseCreateId(result);
}

export async function updateEquipeTjmRecord(
  id: number,
  fields: EquipeTjmWriteFields,
): Promise<void> {
  assertWritableUpdateTableId(EQUIPE_TJM_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant tarif invalide.");
  }
  const payload: Record<string, unknown> = {
    Personne: fields.Personne,
    Specialite: fields.Specialite,
    TJM: fields.TJM,
    Date_debut: fields.Date_debut,
    Date_fin: fields.Date_fin === undefined ? null : fields.Date_fin,
    Commentaire: fields.Commentaire ?? "",
  };
  await getWritableTable(EQUIPE_TJM_TABLE_ID).update({ id, fields: payload });
}

/** Persiste les écritures validées (create sans id, update avec id). */
export async function persistEquipeTjmWrites(
  writes: { id?: number; fields: EquipeTjmWriteFields }[],
): Promise<void> {
  for (const w of writes) {
    if (w.id != null) {
      await updateEquipeTjmRecord(w.id, w.fields);
    } else {
      await createEquipeTjmRecord(w.fields);
    }
  }
}
