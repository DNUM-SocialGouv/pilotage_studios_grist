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
  Taches_realisees?: string;
  Nom_BdC?: string;
}

export interface Mission {
  id: number;
  Nom_de_la_mission?: string;
  Statut?: string;
  Intervenants?: unknown;
  Resp_?: unknown;
  Date_de_debut?: number;
  Produit_SDPC?: unknown;
  Equipe2?: unknown;
  Departement?: unknown;
  Demande?: string;
  Enjeux?: string;
  Historique?: string;
  Fonctionnalites_produit?: string;
  Cible_profils_utilisateurs?: string;
  Pb_utilisateurs_identifies?: string;
  Liens_FIGMA_Notion?: string;
  Suivi_resp_studio?: string;
  Docs?: unknown;
  Volumes_d_usages_utilisateurs_utilisations_?: string;
  Derniere_mise_a_jour?: number;
}

export interface MissionEnfant {
  id: number;
  /** Ref → `Missions` — colonne Grist `Mission_parent` (legacy `Mission`). */
  Mission?: unknown;
  /** Texte — colonne Grist `Titre_de_la_prestation` (fallbacks lecture : `Libelle`, texte `Mission_enfant`). Homonyme de `Realise.Mission_enfant` (ref). */
  Libelle?: string;
  Intervenant?: unknown;
  Specialite?: string;
  Type_prestation?: string;
  Jours_envisages?: number;
  Statut?: string;
  /** Timestamp Grist (secondes) — colonne `Date_de_debut`. */
  Date_de_debut?: number;
}

export interface Intervenant {
  id: number;
  Prenom_Nom?: string;
  Equipe?: string;
  /** Porteur / ESN (`Equipe.Portage`) — MALT, OCTO… */
  Portage?: string;
}

/**
 * Fiche personne pour l’écran `/equipe` (carte d’identité).
 * TJM / Total_TTC : présents seulement si Access Rules les rendent lisibles
 * (Owner / Admin, ou soi-même — pas les collègues). Pas d’e-mail dans le widget.
 */
export interface EquipeMember {
  id: number;
  Prenom_Nom?: string;
  Equipe?: string;
  Portage?: string;
  Statut?: string;
  Specialite?: string;
  Role_ACL?: string;
  Missions_en_cours?: string;
  /** Seed DiceBear Glyphs (colonne Grist `Avatar`). */
  Avatar?: string;
  /** Tarif journalier — uniquement si lisible côté Grist. */
  TJM?: number;
  /** Total TTC — uniquement si lisible côté Grist. */
  Total_TTC?: number;
}

/** Ligne catalogue produits (libellé = colonne Grist `Produit`). */
export type ProduitSdpc = {
  id: number;
  Produit?: unknown;
  /** Département SDPC (`departement_sdpc` / alias). */
  departement_sdpc?: unknown;
  Departement_sdpc?: unknown;
  Statut_actuel?: string;
  Statut_cible?: string;
  /** `true` / `false` si lisible ; `undefined` si censuré / absent. */
  En_prod?: boolean;
  Chef_de_produit?: string;
  Equipe?: string;
  Type_de_produit?: string;
  Description?: string;
  Description_longue?: string;
  URLs_du_produit?: string;
  URL_Front_Office?: string;
  URL_Back_Office?: string;
  Lien_Espace_Collaboratif_Projet?: string;
  Obsolescence?: boolean;
  /** Clé sync référentiel SDPC (UUID source). */
  UUID?: string;
  /** Direction métier / portefeuilles (tags texte). */
  D_Metier?: string;
  Fonctionnalites_et_contexte?: string;
  Liens_repos_depots?: string;
  Actions_de_la_feuille_de_route?: string;
  Statut_d_homologation_de_securite?: string;
  /** Timestamp Grist (secondes). */
  Debut_validite_homologation?: number;
  Fin_de_validite_d_homologation?: number;
  Besoin_DICT_Disponibilite?: string;
  Besoin_DICT_Integrite?: string;
  Besoin_DICT_Confidentialite?: string;
  Besoin_DICT_Tracabilite?: string;
  SCORE_RGAA_Declaration_reglementaire?: string;
  RGAA_Date_declaration?: number;
  /** Ratio 0–1 ou pourcentage. */
  RGAA_Tx_conformite?: number;
  Cibles_du_produit?: string;
  Volumetrie_utilisateurs_par_an?: string;
  Nature_de_l_application?: string;
  Criticite?: string;
  Typologie_d_application?: string;
  Bouton_JDMA?: boolean;
  Lien_stats_JDMA?: string;
  Hebergement?: string;
  Marche_DEV_TMA?: string;
  Prestataire_de_developpement?: string;
  Enjeux_Chiffres_cles?: string;
  Editeur?: string;
  Date_de_demande_de_decomissionnement?: number;
  Retrait_de_service?: number;
  Projet_strategique?: string;
};
