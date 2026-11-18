import type { SuiviMensuel } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";

/**
 * Un CRA compte pour les totaux pilotage / assistant seulement s’il est
 * lié à une prestation (`Realise.Prestation` → table `Prestations`).
 *
 * Phrase métier : « un CRA compte seulement s’il est lié à une prestation ».
 */
export function realiseHasPrestation(row: SuiviMensuel): boolean {
  const id = extractGristReferenceId(row.Mission_enfant);
  return id != null && id !== 0;
}

/** Filtre les lignes CRA pour agrégats mission / BDC / assistant. */
export function filterRealiseWithPrestation(rows: readonly SuiviMensuel[]): SuiviMensuel[] {
  return rows.filter(realiseHasPrestation);
}
