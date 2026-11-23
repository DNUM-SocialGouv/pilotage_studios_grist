/**
 * Écriture BDC via plugin API (`getTable`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 * Update : cadre de la fiche. Create : bon de commande court depuis le panneau Portage.
 * Pas de delete.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  BDC_TABLE_ID,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  sanitizeBdcCreateFromPortageFields,
  sanitizeBdcUpdateFields,
  type BdcCreateFromPortageFields,
  type BdcUpdateFields,
} from "./bdcFormFields.ts";

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

function explainWriteError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes("403") ||
    lower.includes("denied") ||
    lower.includes("permission") ||
    lower.includes("not authorized") ||
    lower.includes("forbidden") ||
    lower.includes("censored")
  ) {
    return (
      `${raw} — Droits insuffisants sur ce champ. ` +
      "Vérifiez que votre compte est Owner du document ou Admin " +
      "(colonne Role_ACL de votre fiche Équipe), sinon Grist refuse l’écriture sur BDC."
    );
  }
  return raw;
}

export async function createBdcFromPortageRecord(
  fields: BdcCreateFromPortageFields,
): Promise<number> {
  assertWritableTableId(BDC_TABLE_ID);
  const safe = sanitizeBdcCreateFromPortageFields({ ...fields });
  try {
    const result = await getWritableTable(BDC_TABLE_ID).create({ fields: safe });
    return parseCreateId(result);
  } catch (err) {
    throw new Error(explainWriteError(err));
  }
}

export async function updateBdcRecord(id: number, fields: BdcUpdateFields): Promise<void> {
  assertWritableUpdateTableId(BDC_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant BDC invalide.");
  }
  const safe = sanitizeBdcUpdateFields({ ...fields });
  try {
    await getWritableTable(BDC_TABLE_ID).update({ id, fields: safe });
  } catch (err) {
    throw new Error(explainWriteError(err));
  }
}
