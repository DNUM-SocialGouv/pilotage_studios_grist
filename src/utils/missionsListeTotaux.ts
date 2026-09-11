import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { formatMontantEur } from "./formatMontant.ts";
import type { CraTotaux } from "./suiviMensuel.ts";

export type CraCellState = "ready" | "loading" | "error";

export function missionListeLibelle(m: Mission): string {
  return m.Nom_de_la_mission?.trim() || `Mission #${m.id}`;
}

export function formatCraJours(
  totaux: CraTotaux | undefined,
  state: CraCellState,
): string {
  if (state === "error") {
    return "—";
  }
  if (state === "loading") {
    return "…";
  }
  if (!totaux || totaux.count === 0) {
    return "—";
  }
  return totaux.jours.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
}

export function formatCraMontant(
  totaux: CraTotaux | undefined,
  state: CraCellState,
): string {
  if (state === "error") {
    return "—";
  }
  if (state === "loading") {
    return "…";
  }
  if (!totaux || totaux.count === 0) {
    return "—";
  }
  return formatMontantEur(totaux.ttc);
}

export function totauxCraDuLot(
  enfants: MissionEnfant[],
  craByEnfantId: Map<number, CraTotaux> | undefined,
): CraTotaux | undefined {
  if (!craByEnfantId) {
    return undefined;
  }
  let jours = 0;
  let ttc = 0;
  let count = 0;
  for (const e of enfants) {
    const t = craByEnfantId.get(e.id);
    if (!t) {
      continue;
    }
    jours += t.jours;
    ttc += t.ttc;
    count += t.count;
  }
  return count === 0 ? undefined : { jours, ttc, count };
}

/** Vrai si les deux libellés désignent la même personne (casse / espaces ignorés). */
export function samePersonLabel(
  a: string | undefined,
  b: string | undefined,
): boolean {
  const left = a?.trim();
  const right = b?.trim();
  if (!left || !right) {
    return false;
  }
  return left.toLowerCase() === right.toLowerCase();
}

export function equipeLabelForEnfant(
  e: MissionEnfant,
  equipesByIntervenantId: Map<number, string>,
): string | undefined {
  const iid = extractGristReferenceId(e.Intervenant);
  if (iid == null || iid === 0) {
    return undefined;
  }
  const eq = equipesByIntervenantId.get(iid)?.trim();
  return eq || undefined;
}

export function produitLibelle(
  m: Mission,
  produitsById: Map<number, string>,
): string {
  const ref = extractGristReferenceId(m.Produit_SDPC);
  if (ref === undefined) {
    return "—";
  }
  return produitsById.get(ref) ?? `Produit #${ref}`;
}

export function craRowsSorted(rows: SuiviMensuel[]): SuiviMensuel[] {
  return rows.slice().sort((a, b) => {
    const ta = typeof a.Periode === "number" ? a.Periode : 0;
    const tb = typeof b.Periode === "number" ? b.Periode : 0;
    return ta - tb;
  });
}
