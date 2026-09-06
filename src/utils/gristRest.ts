/**
 * Lecture REST document via jeton widget (`getAccessToken`) — sans clé API bundle.
 */

import { isAllowlistedTableId } from "../security/fetchTableAllowlist";
import { getGristAccessToken } from "./gristAccessToken";

type GristRecordsResponse = {
  records?: Array<{ id: number; fields?: Record<string, unknown> }>;
};

/**
 * Récupère des lignes d’une table (format REST `{ id, ...fields }`).
 * `filter` : objet Grist `filter` (ex. `{ id: [148] }`).
 * TableId limité à l’allowlist `fetchTable` (même surface que le plugin API).
 */
export async function fetchGristRecordsViaToken(
  tableId: string,
  filter?: Record<string, (string | number | boolean | null)[]>,
): Promise<Array<Record<string, unknown> & { id: number }>> {
  if (!isAllowlistedTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour REST : ${tableId}`);
  }

  const { token, baseUrl } = await getGristAccessToken(true);
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/tables/${encodeURIComponent(tableId)}/records`);
  url.searchParams.set("auth", token);
  url.searchParams.set("limit", "0");
  if (filter) {
    url.searchParams.set("filter", JSON.stringify(filter));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Lecture ${tableId} impossible (${response.status}).`);
  }

  const data = (await response.json()) as GristRecordsResponse;
  const records = Array.isArray(data.records) ? data.records : [];
  return records.map((record) => ({
    id: record.id,
    ...(record.fields ?? {}),
  }));
}
