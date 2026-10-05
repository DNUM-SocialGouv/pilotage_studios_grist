/**
 * Update cadre BDC via plugin API (`getTable().update`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 * Pas de create / delete.
 */

import {
  BDC_TABLE_ID,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  sanitizeBdcUpdateFields,
  type BdcUpdateFields,
} from "./bdcFormFields.ts";

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
