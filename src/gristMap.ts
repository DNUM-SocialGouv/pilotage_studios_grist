import type { GristFetchTableResult, GristRecord } from "./gristTypes";
import type {
  BDC,
  CommandeSofiane,
  Constatation,
  Intervenant,
  Mission,
  MissionEnfant,
  PlanActivite,
  ProduitSdpc,
  SuiviMensuel,
} from "./types";
import { asGristChoice } from "./utils/gristReferences";
import { missionEnfantFromGrist } from "./utils/missionEnfants";

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
  // Valeurs plugin décodées (CensoredValue, etc.) — pas de faux positifs URL.
  if (value != null && typeof value === "object" && "toString" in value) {
    const label = String(value);
    if (label === "CENSORED" || label === "..." || label.startsWith("[Pending")) {
      return undefined;
    }
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

export function toSuiviMensuel(record: GristRecord): SuiviMensuel {
  return {
    id: record.id,
    Annee: asString(record.Annee),
    Mois: asString(record.Mois),
    Periode:
      typeof record.Periode === "number" || typeof record.Periode === "string"
        ? record.Periode
        : asNumber(record.Periode) ?? asString(record.Periode),
    Intervenants: record.Intervenants,
    Missions: record.Missions,
    Mission_enfant: record.Mission_enfant,
    Nb_jours: asNumber(record.Nb_jours),
    Equipe: asGristChoice(record.Equipe) ?? asString(record.Equipe),
    Produit: record.Produit,
    Calcul_TTC: asNumber(record.Calcul_TTC),
    TTC: asNumber(record.TTC),
    BDC_cible: record.BDC_cible,
    Bdc_Chorus2: record.Bdc_Chorus2,
    Taches_realisees: asString(record.Taches_realisees),
    Nom_BdC: asString(record.Nom_BdC) ?? asGristChoice(record.Nom_BdC),
  };
}

function asMultilineText(value: unknown): string | undefined {
  return asString(value) ?? asGristChoice(value);
}

export function toMission(record: GristRecord): Mission {
  return {
    id: record.id,
    Nom_de_la_mission: asString(record.Nom_de_la_mission) ?? asGristChoice(record.Nom_de_la_mission),
    Statut: asGristChoice(record.Statut) ?? asString(record.Statut),
    Intervenants: record.Intervenants,
    Resp_: record.Resp_,
    Date_de_debut: asNumber(record.Date_de_debut),
    Produit_SDPC: record.Produit_SDPC,
    Equipe2: record.Equipe2,
    Departement: record.Departement ?? record["$Departement"],
    Demande: asMultilineText(record.Demande),
    Enjeux: asMultilineText(record.Enjeux),
    Historique: asMultilineText(record.Historique),
    Fonctionnalites_produit: asMultilineText(record.Fonctionnalites_produit),
    Cible_profils_utilisateurs: asMultilineText(record.Cible_profils_utilisateurs),
    Pb_utilisateurs_identifies: asMultilineText(record.Pb_utilisateurs_identifies),
    Liens_FIGMA_Notion: asMultilineText(record.Liens_FIGMA_Notion),
    Suivi_resp_studio: asMultilineText(record.Suivi_resp_studio),
    Docs: record.Docs,
    Volumes_d_usages_utilisateurs_utilisations_: asMultilineText(
      record.Volumes_d_usages_utilisateurs_utilisations_,
    ),
    Derniere_mise_a_jour: asNumber(record.Derniere_mise_a_jour),
  };
}

/** `Missions_enfants` : `missionEnfantFromGrist` priorise `Libelle` puis texte `Mission_enfant`. */
export function toMissionEnfant(record: GristRecord): MissionEnfant {
  const { Mission, Libelle } = missionEnfantFromGrist(record);
  return {
    id: record.id,
    Mission,
    Libelle,
    Intervenant: record.Intervenant,
    Specialite: asGristChoice(record.Specialite) ?? asString(record.Specialite),
    Type_prestation: asGristChoice(record.Type_prestation) ?? asString(record.Type_prestation),
    Statut: asGristChoice(record.Statut) ?? asString(record.Statut),
  };
}

export function toIntervenant(record: GristRecord): Intervenant {
  return {
    id: record.id,
    Prenom_Nom: asString(record.Prenom_Nom) ?? asGristChoice(record.Prenom_Nom),
    Equipe: asGristChoice(record.Equipe) ?? asString(record.Equipe),
  };
}

export function toProduitSdpc(record: GristRecord): ProduitSdpc {
  return { id: record.id, Produit: record.Produit };
}
