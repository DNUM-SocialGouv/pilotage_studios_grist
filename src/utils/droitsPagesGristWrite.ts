/**
 * Update `Droits_pages` via plugin API (`getTable().update`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 */

import type { GristFetchTableResult } from "../gristTypes.ts";
import {
  DROITS_PAGES_TABLE_ID,
  fetchAllowlistedTable,
} from "../security/fetchTableAllowlist.ts";
import {
  pageAccessFromRecord,
  type PageAccessFlags,
  type PageAccessKey,
} from "../security/pageAccess.ts";
import { assertWritableUpdateTableId } from "../security/writeTableAllowlist.ts";
import { editablePageAccessKeys } from "./droitsPagesThemes.ts";

function getWritableTable(tableId: string) {
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  return grist.getTable(tableId);
}

/** Parse minimal (évite d’importer gristMap dans les tests Node). */
function recordsFromFetch(
  raw: GristFetchTableResult,
): Array<Record<string, unknown> & { id: number }> {
  const ids = raw.id ?? [];
  const keys = Object.keys(raw).filter((k) => k !== "id");
  return ids.map((id, index) => {
    const row: Record<string, unknown> & { id: number } = { id };
    for (const key of keys) {
      row[key] = raw[key]?.[index];
    }
    return row;
  });
}

/**
 * Patch d’**une** case éditable uniquement (évite d’écraser d’autres `Page_*`
 * si le brouillon est incomplet).
 */
export function sanitizeDroitsPagesPatchField(
  key: PageAccessKey,
  value: boolean,
): Record<string, boolean> {
  const editable = new Set(editablePageAccessKeys());
  if (key === "Page_accueil" || !editable.has(key)) {
    throw new Error(`Colonne « ${key} » non modifiable depuis le widget.`);
  }
  return { [key]: value === true };
}

export async function fetchDroitsPagesFlagsById(
  id: number,
): Promise<PageAccessFlags | null> {
  const raw = await fetchAllowlistedTable(DROITS_PAGES_TABLE_ID);
  const row = recordsFromFetch(raw).find((r) => r.id === id);
  if (!row) {
    return null;
  }
  const fields: Record<string, unknown> = { ...row };
  delete fields.id;
  return pageAccessFromRecord(fields);
}

function explainWriteError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes("403") ||
    lower.includes("denied") ||
    lower.includes("permission") ||
    lower.includes("not authorized") ||
    lower.includes("forbidden")
  ) {
    return (
      `${raw} — Vérifiez que votre compte est Owner du document ou Admin ` +
      `(colonne Role_ACL de votre fiche Équipe), sinon Grist refuse l’écriture sur Droits_pages.`
    );
  }
  return raw;
}

/**
 * Met à jour **une** case `Page_*`, puis relit pour confirmer la persistance.
 */
export async function updateDroitsPagesRecord(
  id: number,
  key: PageAccessKey,
  value: boolean,
): Promise<PageAccessFlags> {
  assertWritableUpdateTableId(DROITS_PAGES_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant Droits_pages invalide.");
  }
  const fields = sanitizeDroitsPagesPatchField(key, value);
  try {
    await getWritableTable(DROITS_PAGES_TABLE_ID).update({ id, fields });
  } catch (err) {
    throw new Error(explainWriteError(err));
  }

  const verified = await fetchDroitsPagesFlagsById(id);
  if (!verified) {
    throw new Error(
      "Écriture envoyée mais la ligne Droits_pages est illisible ensuite (droits Grist ?).",
    );
  }
  if (verified[key] !== fields[key]) {
    throw new Error(
      `Grist n’a pas conservé « ${key} » (attendu ${String(fields[key])}, lu ${String(verified[key])}). ` +
        "Vérifiez les Access Rules sur Droits_pages (Owner ou Role_ACL Admin).",
    );
  }
  return verified;
}
