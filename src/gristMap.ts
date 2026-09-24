import type { GristFetchTableResult, GristRecord } from "./gristTypes";
import type {
  BDC,
  CommandeSofiane,
  Constatation,
  EquipeMember,
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
    const trimmed = value.trim();
    if (!trimmed || trimmed === "CENSORED" || trimmed === "..." || trimmed.startsWith("[Pending")) {
      return undefined;
    }
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  // Valeurs plugin décodées (CensoredValue, etc.) — pas de faux positifs URL.
  if (value != null && typeof value === "object" && "toString" in value) {
    const label = String(value).trim();
    if (!label || label === "CENSORED" || label === "..." || label.startsWith("[Pending")) {
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

/** `Missions_enfants` : `missionEnfantFromGrist` priorise `Titre_de_la_prestation` puis legacy. */
export function toMissionEnfant(record: GristRecord): MissionEnfant {
  const { Mission, Libelle } = missionEnfantFromGrist(record);
  return {
    id: record.id,
    Mission,
    Libelle,
    Intervenant: record.Intervenant,
    Specialite: asGristChoice(record.Specialite) ?? asString(record.Specialite),
    Type_prestation: asGristChoice(record.Type_prestation) ?? asString(record.Type_prestation),
    Jours_envisages: asNumber(record.Jours_envisages),
    Statut: asGristChoice(record.Statut) ?? asString(record.Statut),
    Date_de_debut: asNumber(record.Date_de_debut),
  };
}

export function toIntervenant(record: GristRecord): Intervenant {
  return {
    id: record.id,
    Prenom_Nom: asString(record.Prenom_Nom) ?? asGristChoice(record.Prenom_Nom),
    Equipe: asGristChoice(record.Equipe) ?? asString(record.Equipe),
    Portage: asGristChoice(record.Portage) ?? asString(record.Portage),
  };
}

export function toEquipeMember(record: GristRecord): EquipeMember {
  return {
    id: record.id,
    Prenom_Nom: asString(record.Prenom_Nom) ?? asGristChoice(record.Prenom_Nom),
    Equipe: asGristChoice(record.Equipe) ?? asString(record.Equipe),
    Portage: asGristChoice(record.Portage) ?? asString(record.Portage),
    Statut: asGristChoice(record.Statut) ?? asString(record.Statut),
    Specialite: asGristChoice(record.Specialite) ?? asString(record.Specialite),
    Role_ACL: asGristChoice(record.Role_ACL) ?? asString(record.Role_ACL),
    Ordinateur2: asGristChoice(record.Ordinateur2) ?? asString(record.Ordinateur2),
    Mode_recrutement:
      asGristChoice(record.Mode_recrutement) ?? asString(record.Mode_recrutement),
    Missions_en_cours:
      asString(record.Missions_en_cours) ?? asGristChoice(record.Missions_en_cours),
    Avatar: asString(record.Avatar) ?? asGristChoice(record.Avatar),
    // CENSORED / illisible → undefined (pas d’affichage widget)
    TJM: asNumber(record.TJM),
    Total_TTC: asNumber(record.Total_TTC),
  };
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1" || value === "true" || value === "True") {
    return true;
  }
  if (value === 0 || value === "0" || value === "false" || value === "False") {
    return false;
  }
  return undefined;
}

export function toProduitSdpc(record: GristRecord): ProduitSdpc {
  return {
    id: record.id,
    Produit: record.Produit,
    departement_sdpc: record.departement_sdpc,
    Departement_sdpc: record.Departement_sdpc,
    Statut_actuel: asGristChoice(record.Statut_actuel) ?? asString(record.Statut_actuel),
    Statut_cible: asGristChoice(record.Statut_cible) ?? asString(record.Statut_cible),
    En_prod: asBoolean(record.En_prod),
    Chef_de_produit:
      asString(record.Chef_de_produit) ?? asGristChoice(record.Chef_de_produit),
    Equipe: asGristChoice(record.Equipe) ?? asString(record.Equipe),
    Type_de_produit:
      asGristChoice(record.Type_de_produit) ?? asString(record.Type_de_produit),
    Description: asMultilineText(record.Description),
    Description_longue: asMultilineText(record.Description_longue),
    URLs_du_produit: asString(record.URLs_du_produit) ?? asGristChoice(record.URLs_du_produit),
    URL_Front_Office:
      asString(record.URL_Front_Office) ?? asGristChoice(record.URL_Front_Office),
    URL_Back_Office:
      asString(record.URL_Back_Office) ?? asGristChoice(record.URL_Back_Office),
    Lien_Espace_Collaboratif_Projet:
      asString(record.Lien_Espace_Collaboratif_Projet) ??
      asGristChoice(record.Lien_Espace_Collaboratif_Projet),
    Obsolescence: asBoolean(record.Obsolescence),
    UUID: asString(record.UUID),
    D_Metier: asGristChoice(record.D_Metier) ?? asString(record.D_Metier),
    Fonctionnalites_et_contexte: asMultilineText(record.Fonctionnalites_et_contexte),
    Liens_repos_depots:
      asString(record.Liens_repos_depots) ?? asGristChoice(record.Liens_repos_depots),
    Actions_de_la_feuille_de_route: asMultilineText(record.Actions_de_la_feuille_de_route),
    Statut_d_homologation_de_securite:
      asGristChoice(record.Statut_d_homologation_de_securite) ??
      asString(record.Statut_d_homologation_de_securite),
    Debut_validite_homologation: asNumber(record.Debut_validite_homologation),
    Fin_de_validite_d_homologation: asNumber(record.Fin_de_validite_d_homologation),
    Besoin_DICT_Disponibilite:
      asGristChoice(record.Besoin_DICT_Disponibilite) ??
      asString(record.Besoin_DICT_Disponibilite),
    Besoin_DICT_Integrite:
      asGristChoice(record.Besoin_DICT_Integrite) ?? asString(record.Besoin_DICT_Integrite),
    Besoin_DICT_Confidentialite:
      asGristChoice(record.Besoin_DICT_Confidentialite) ??
      asString(record.Besoin_DICT_Confidentialite),
    Besoin_DICT_Tracabilite:
      asGristChoice(record.Besoin_DICT_Tracabilite) ??
      asString(record.Besoin_DICT_Tracabilite),
    SCORE_RGAA_Declaration_reglementaire:
      asGristChoice(record.SCORE_RGAA_Declaration_reglementaire) ??
      asString(record.SCORE_RGAA_Declaration_reglementaire),
    RGAA_Date_declaration: asNumber(record.RGAA_Date_declaration),
    RGAA_Tx_conformite: asNumber(record.RGAA_Tx_conformite),
    Cibles_du_produit:
      asGristChoice(record.Cibles_du_produit) ?? asString(record.Cibles_du_produit),
    Volumetrie_utilisateurs_par_an:
      asGristChoice(record.Volumetrie_utilisateurs_par_an) ??
      asString(record.Volumetrie_utilisateurs_par_an),
    Nature_de_l_application:
      asGristChoice(record.Nature_de_l_application) ??
      asString(record.Nature_de_l_application),
    Criticite: asGristChoice(record.Criticite) ?? asString(record.Criticite),
    Typologie_d_application:
      asGristChoice(record.Typologie_d_application) ??
      asString(record.Typologie_d_application),
    Bouton_JDMA: asBoolean(record.Bouton_JDMA),
    Lien_stats_JDMA:
      asString(record.Lien_stats_JDMA) ?? asGristChoice(record.Lien_stats_JDMA),
    Hebergement: asGristChoice(record.Hebergement) ?? asString(record.Hebergement),
    Marche_DEV_TMA:
      asGristChoice(record.Marche_DEV_TMA) ?? asString(record.Marche_DEV_TMA),
    Prestataire_de_developpement:
      asGristChoice(record.Prestataire_de_developpement) ??
      asString(record.Prestataire_de_developpement),
    Enjeux_Chiffres_cles: asMultilineText(record.Enjeux_Chiffres_cles),
    Editeur: asGristChoice(record.Editeur) ?? asString(record.Editeur),
    Date_de_demande_de_decomissionnement: asNumber(
      record.Date_de_demande_de_decomissionnement,
    ),
    Retrait_de_service: asNumber(record.Retrait_de_service),
    Projet_strategique:
      asGristChoice(record.Projet_strategique) ?? asString(record.Projet_strategique),
  };
}
