import type { BDC, Constatation, PlanActivite } from "../types";
import { extractGristReferenceId } from "./gristReferences";

export function libellePlanActivite(pa: PlanActivite): string {
  const desc = pa.Description?.trim();
  const sofianeId = pa.Sofiane_ID;
  if (desc && sofianeId != null) {
    return `${sofianeId} — ${desc}`;
  }
  if (desc) {
    return desc;
  }
  if (sofianeId != null) {
    return `PA ${sofianeId}`;
  }
  return `PA #${pa.id}`;
}

/** Enveloppe PA : `PA_Ajuste` en priorité, sinon `AE`. */
export function planActiviteEnveloppe(pa: Pick<PlanActivite, "PA_Ajuste" | "AE">): number {
  if (typeof pa.PA_Ajuste === "number" && Number.isFinite(pa.PA_Ajuste)) {
    return pa.PA_Ajuste;
  }
  if (typeof pa.AE === "number" && Number.isFinite(pa.AE)) {
    return pa.AE;
  }
  return 0;
}

export function bdcPaRefId(bdc: Pick<BDC, "PA">): number | undefined {
  const id = extractGristReferenceId(bdc.PA);
  return id != null && id > 0 ? id : undefined;
}

function positiveRefId(value: unknown): number | undefined {
  const id = extractGristReferenceId(value);
  return id != null && id > 0 ? id : undefined;
}

function sumFinite(values: Array<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
    }
  }
  return total;
}

export type PaFinance = {
  enveloppe: number;
  engage: number;
  consommeCra: number;
  constatePv: number;
  resteAEngager: number;
  resteAConsommer: number;
  engageSofiane: number;
  engageSofianeNonRapproche: number;
  payeSofiane: number;
};

export function computePaFinance(input: {
  enveloppe: number;
  bdcMontantsTtc: Array<number | null | undefined>;
  bdcConsommeCra: Array<number | null | undefined>;
  pvMontantsTtc: Array<number | null | undefined>;
  sofianeCommandesTtc?: Array<number | null | undefined>;
  sofianeUnmatchedTtc?: Array<number | null | undefined>;
  sofianePaye?: Array<number | null | undefined>;
}): PaFinance {
  const enveloppe = Number.isFinite(input.enveloppe) ? input.enveloppe : 0;
  const engage = sumFinite(input.bdcMontantsTtc);
  const consommeCra = sumFinite(input.bdcConsommeCra);
  const constatePv = sumFinite(input.pvMontantsTtc);
  const engageSofiane = sumFinite(input.sofianeCommandesTtc ?? []);
  const engageSofianeNonRapproche = sumFinite(input.sofianeUnmatchedTtc ?? []);
  const payeSofiane = sumFinite(input.sofianePaye ?? []);
  return {
    enveloppe,
    engage,
    consommeCra,
    constatePv,
    resteAEngager: enveloppe - engage,
    resteAConsommer: enveloppe - consommeCra,
    engageSofiane,
    engageSofianeNonRapproche,
    payeSofiane,
  };
}

export function financeForPlanActivite(
  pa: PlanActivite,
  bdcList: BDC[],
  constatations: Constatation[],
  sofianeCommandes?: Array<{
    Montant_TTC?: number;
    Montant_Paye?: number;
    BDC?: unknown;
    PA?: unknown;
  }>,
): PaFinance {
  const paBdcs = bdcList.filter((bdc) => bdcPaRefId(bdc) === pa.id);
  const bdcIds = new Set(paBdcs.map((bdc) => bdc.id));
  const pvs = constatations.filter((c) => {
    const bdcId = positiveRefId(c.BDC);
    return bdcId != null && bdcIds.has(bdcId);
  });
  const paCommandes = (sofianeCommandes ?? []).filter(
    (cmd) => positiveRefId(cmd.PA) === pa.id,
  );
  const unmatched = paCommandes.filter((cmd) => positiveRefId(cmd.BDC) == null);
  return computePaFinance({
    enveloppe: planActiviteEnveloppe(pa),
    bdcMontantsTtc: paBdcs.map((bdc) => bdc.Montant_TTC),
    bdcConsommeCra: paBdcs.map((bdc) => bdc.Total_TTC_CRA),
    pvMontantsTtc: pvs.map((pv) => pv.Montant_TTC),
    sofianeCommandesTtc: paCommandes.map((cmd) => cmd.Montant_TTC),
    sofianeUnmatchedTtc: unmatched.map((cmd) => cmd.Montant_TTC),
    sofianePaye: paCommandes.map((cmd) => cmd.Montant_Paye),
  });
}

/** Finance minimale (colonnes PA seules) quand l’accès multi-tables n’est pas accordé. */
export function financePaOnly(pa: PlanActivite): PaFinance {
  return computePaFinance({
    enveloppe: planActiviteEnveloppe(pa),
    bdcMontantsTtc: [],
    bdcConsommeCra: [],
    pvMontantsTtc: [],
  });
}
