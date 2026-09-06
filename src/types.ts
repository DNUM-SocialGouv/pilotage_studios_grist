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
