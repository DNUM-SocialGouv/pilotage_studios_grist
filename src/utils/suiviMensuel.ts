import type { SuiviMensuel } from "../types.ts";

export function parseGristNumeric(value: unknown): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") {
      return undefined;
    }
    const normalized = t.replace(/\u00a0/g, " ").replace(/\s/g, "").replace(",", ".");
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const SUIVI_TTC_KEYS_PRIORITY = [
  "TTC",
  "Calcul_TTC",
  "Montant_TTC",
  "Total_TTC",
  "Montant_facture_TTC",
  "Montant_facture",
] as const;

function suiviFieldLooksLikeAmountKey(key: string): boolean {
  const kl = key.toLowerCase();
  if (kl.includes("bdc") || kl.includes("chorus")) {
    return false;
  }
  if (kl.includes("nb_jours") || kl === "nbjours" || kl.includes("jour_estim")) {
    return false;
  }
  if (kl.includes("ttc")) {
    return true;
  }
  if (kl.includes("montant") && kl.includes("facture")) {
    return true;
  }
  return false;
}

/**
 * Montant TTC affichable pour une ligne `Realise`.
 * Si `TTC` / `Calcul_TTC` sont à 0 mais qu’une autre colonne porte le montant, on la prend.
 */
export function montantTtcSuiviMensuel(row: SuiviMensuel): number | undefined {
  const r = row as SuiviMensuel & Record<string, unknown>;

  for (const k of SUIVI_TTC_KEYS_PRIORITY) {
    const n = parseGristNumeric(r[k]);
    if (n !== undefined && n !== 0) {
      return n;
    }
  }

  for (const [k, v] of Object.entries(r)) {
    if (k === "id" || !suiviFieldLooksLikeAmountKey(k)) {
      continue;
    }
    const n = parseGristNumeric(v);
    if (n !== undefined && n !== 0) {
      return n;
    }
  }

  for (const k of SUIVI_TTC_KEYS_PRIORITY) {
    const n = parseGristNumeric(r[k]);
    if (n !== undefined) {
      return n;
    }
  }

  return undefined;
}

export function montantTtcLigneSuivi(row: SuiviMensuel): number {
  return montantTtcSuiviMensuel(row) ?? 0;
}

export type CraTotaux = { jours: number; ttc: number; count: number };

export type TtcParLabelEntry = { label: string; ttc: number };

/** TTC cumulé par libellé (tri décroissant, puis alpha). */
export function aggregateTtcByLabel(
  rows: SuiviMensuel[],
  labelOf: (s: SuiviMensuel) => string,
): TtcParLabelEntry[] {
  const map = new Map<string, number>();
  for (const s of rows) {
    const label = labelOf(s);
    const prev = map.get(label) ?? 0;
    const m = montantTtcSuiviMensuel(s);
    const add = m != null && Number.isFinite(m) ? m : 0;
    map.set(label, prev + add);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .map(([label, ttc]) => ({ label, ttc }));
}
