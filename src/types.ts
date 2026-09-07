export interface PlanActivite {
  id: number;
  Sofiane_ID?: number;
  Annee?: number;
  Description?: string;
  Bureau?: string;
  Domaine?: string;
  Sous_domaine?: string;
  AE?: number;
  PA_Ajuste?: number;
  Programme?: string;
  Priorite?: string;
  Categorie?: string;
  Responsable_activite?: string;
  Contrat?: string;
  Titulaire?: string;
}

export interface BDC {
  id: number;
  Nom_BdC?: string;
  Statut?: string;
  Montant_TTC?: number;
  Financeur?: string;
  BdC_Chorus?: string;
  Plateforme?: string;
  Engagement?: string;
  /** URL ou libellé Sofiane. */
  SOFIANE?: string;
  /** Pièce(s) jointe(s) devis — colonne Grist Attachments. */
  Devis?: unknown;
  Solde_TTC_CRA?: number;
  Total_TTC_CRA?: number;
  /** ChoiceList Grist — tokens via `extractGristStringTokens`. */
  Equipe2?: unknown;
  /** Réf. → `Plan_activite`. */
  PA?: unknown;
}

export interface Constatation {
  id: number;
  BDC?: unknown;
  Montant_TTC?: number;
}

export interface CommandeSofiane {
  id: number;
  PA?: unknown;
  BDC?: unknown;
  Montant_TTC?: number;
  Montant_Paye?: number;
  Objet?: string;
  Chorus?: string;
}

/** Ligne CRA / suivi mensuel (table Grist `Realise`). */
export interface SuiviMensuel {
  id: number;
  Annee?: string;
  Mois?: string;
  Periode?: string | number;
  Intervenants?: unknown;
  Missions?: unknown;
  Mission_enfant?: unknown;
  Nb_jours?: number;
  Equipe?: string;
  Produit?: unknown;
  Calcul_TTC?: number;
  TTC?: number;
  BDC_cible?: unknown;
  Bdc_Chorus2?: unknown;
}

export interface Mission {
  id: number;
  Nom_de_la_mission?: string;
}

export interface MissionEnfant {
  id: number;
  Mission?: unknown;
  Libelle?: string;
  Intervenant?: unknown;
  Specialite?: string;
}

export interface Intervenant {
  id: number;
  Prenom_Nom?: string;
}

/** Ligne catalogue produits — garder les colonnes Grist (libellé = `Produit`). */
export type ProduitSdpc = { id: number } & Record<string, unknown>;
