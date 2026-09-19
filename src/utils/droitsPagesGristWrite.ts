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
  PAGE_ACCESS_KEYS,
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
 * Ne garde que les `Page_*` éditables ; force `Page_accueil` à true.
 * Ignore toute clé hors allowlist `PAGE_ACCESS_KEYS`.
 */
export function sanitizeDroitsPagesUpdateFields(
  flags: Partial<PageAccessFlags>,
): Record<PageAccessKey, boolean> {
  const editable = new Set(editablePageAccessKeys());
  const out = {} as Record<PageAccessKey, boolean>;
  for (const key of PAGE_ACCESS_KEYS) {
    if (key === "Page_accueil") {
      out[key] = true;
      continue;
    }
    if (!editable.has(key)) {
      continue;
    }
    out[key] = flags[key] === true;
  }
  return out;
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
 * Met à jour une ligne, puis relit pour confirmer que Grist a bien persisté.
 */
export async function updateDroitsPagesRecord(
  id: number,
  flags: Partial<PageAccessFlags>,
): Promise<PageAccessFlags> {
  assertWritableUpdateTableId(DROITS_PAGES_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant Droits_pages invalide.");
  }
  const fields = sanitizeDroitsPagesUpdateFields(flags);
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
  for (const key of Object.keys(fields) as PageAccessKey[]) {
    if (verified[key] !== fields[key]) {
      throw new Error(
        `Grist n’a pas conservé « ${key} » (attendu ${String(fields[key])}, lu ${String(verified[key])}). ` +
          "Vérifiez les Access Rules sur Droits_pages (Owner ou Role_ACL Admin).",
      );
    }
  }
  return verified;
}
