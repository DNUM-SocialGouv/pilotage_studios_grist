import type { GristFetchTableResult, GristRecord } from "./gristTypes";
import type { BDC, CommandeSofiane, Constatation, PlanActivite } from "./types";
import { asGristChoice } from "./utils/gristReferences";

export function recordsFromFetchTable(raw: GristFetchTableResult): GristRecord[] {
  const ids = raw.id ?? [];
  const keys = Object.keys(raw).filter((k) => k !== "id");
  return ids.map((id, index) => {
    const row: GristRecord = { id };
    for (const key of keys) {
      row[key] = raw[key]?.[index];
    }
    return row;
  });
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function toPlanActivite(record: GristRecord): PlanActivite {
  return {
    id: record.id,
    Sofiane_ID: asNumber(record.Sofiane_ID),
    Annee: asNumber(record.Annee),
    Description: asString(record.Description),
    Bureau: asString(record.Bureau),
    Domaine: asString(record.Domaine),
    Sous_domaine: asString(record.Sous_domaine),
    AE: asNumber(record.AE),
    PA_Ajuste: asNumber(record.PA_Ajuste),
    Programme: asString(record.Programme),
    Priorite: asString(record.Priorite),
    Categorie: asString(record.Categorie),
    Responsable_activite: asString(record.Responsable_activite),
    Contrat: asString(record.Contrat),
    Titulaire: asString(record.Titulaire),
  };
}

export function toBdc(record: GristRecord): BDC {
  return {
    id: record.id,
    Nom_BdC: asString(record.Nom_BdC) ?? asGristChoice(record.Nom_BdC),
    Statut: asGristChoice(record.Statut),
    Montant_TTC: asNumber(record.Montant_TTC),
    Financeur: asGristChoice(record.Financeur),
    BdC_Chorus: asString(record.BdC_Chorus) ?? asGristChoice(record.BdC_Chorus),
    Plateforme: asGristChoice(record.Plateforme),
    Engagement: asGristChoice(record.Engagement) ?? asString(record.Engagement),
    SOFIANE: asString(record.SOFIANE),
    Devis: record.Devis,
    Solde_TTC_CRA: asNumber(record.Solde_TTC_CRA),
    Total_TTC_CRA: asNumber(record.Total_TTC_CRA),
    Equipe2: record.Equipe2,
    PA: record.PA,
  };
}

export function toConstatation(record: GristRecord): Constatation {
  return {
    id: record.id,
    BDC: record.BDC,
    Montant_TTC: asNumber(record.Montant_TTC),
  };
}

export function toCommandeSofiane(record: GristRecord): CommandeSofiane {
  return {
    id: record.id,
    PA: record.PA,
    BDC: record.BDC,
    Montant_TTC: asNumber(record.Montant_TTC),
    Montant_Paye: asNumber(record.Montant_Paye),
    Objet: asString(record.Objet),
    Chorus: asString(record.Chorus),
  };
}
