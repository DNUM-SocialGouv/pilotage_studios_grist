import type { SuiviMensuel } from "../types.ts";
import {
  extractGristReferenceId,
  extractProduitLibelleFromSuivi,
  extractProduitRefFromSuivi,
} from "./gristReferences.ts";
import { libelleProduitGrist } from "./pilotageProduits.ts";

export function labelIntervenantSuivi(
  s: SuiviMensuel,
  intervenantsById: Map<number, string>,
): string {
  const id = extractGristReferenceId(s.Intervenants);
  if (id == null) {
    return "—";
  }
  return intervenantsById.get(id) ?? `#${id}`;
}

export function labelProduitSuivi(s: SuiviMensuel, produitsById: Map<number, string>): string {
  const direct = extractProduitLibelleFromSuivi(s as unknown as Record<string, unknown>);
  if (direct) {
    return direct;
  }
  const pid = extractProduitRefFromSuivi(s as unknown as Record<string, unknown>);
  if (pid === undefined) {
    return "—";
  }
  return produitsById.get(pid) ?? libelleProduitGrist({}, pid);
}
