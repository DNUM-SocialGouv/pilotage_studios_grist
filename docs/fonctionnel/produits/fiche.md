# Fiche produit — `/produits/:id`

[← Produits](README.md) › **Fiche**

## Objet

Voir un produit du catalogue SDPC en lecture seule : identité (hero type Mon carnet),
référentiel SDPC (~37 champs sync) regroupé en page document, et missions rattachées.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/produits/:id` |
| Page | `src/pages/ProduitsDetailView.tsx` (sous `ProduitsLayout`) |
| Retour | Fil d’Ariane : Accueil › Produits › nom du produit (intégré au hero) |
| Issue | [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3) |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Produit introuvable » + retour liste |
| OK | Hero · onglets Missions · Informations |

## Affichage

### Hero (style Mon carnet)

| Zone | Contenu |
|------|---------|
| Titre | Libellé `Produit` + pastilles département / direction métier à droite (alignées en haut) |
| Badges | Statut actuel · Statut cible · En production · Obsolescence (sous le titre) |
| Sous-titre | `Description` si distincte du nom (nom complet) |
| Type | `Type_de_produit` si renseigné |
| Liens rapides | Site (`URLs_du_produit` ou FO) · espace collab. |

### Onglets

| Onglet | Contenu |
|--------|---------|
| **Missions** (1er) | Liste en **accordéons DSFR** (`fr-accordions-group`) : une mission = un accordéon. Tri métier (**en cours d’abord**, puis terminées ; alpha dans chaque groupe). Les missions en cours sont **ouvertes par défaut** ; les terminées restent fermées. Label : titre · badge statut · résumé (`N prestations · X j · Y € TTC`). Contenu déplié : bouton secondaire « Ouvrir la fiche mission » + bloc « Équipe & prestations » **sans filtres**, colonnes orientées réalisé (en-têtes courts Jours / CRA / TTC, densité `fr-table--sm`) — lecture seule. Colonne **Prestation dominante** (les autres colonnes ont une largeur fixe étroite via `colgroup` ; Prestation prend le reste) ; pas de scroll horizontal. Barre TTC titrée « Répartition du TTC par équipe » (le % = part d’équipe dans le TTC CRA, **pas** un avancement de mission). |
| **Informations** | Page document (lecture continue) : ~37 champs sync regroupés en **5 groupes métier** — plus les 4 onglets Identité / Sécurité / Utilisateurs / Cycle. Pas de compteurs rempli/total. Champs vides masqués. |

#### Groupes métier (onglet Informations)

| Groupe | Contenu |
|--------|---------|
| Présentation | Nom · Nom complet · Fonctionnalités et contexte · description longue si présente (bloc narratif) |
| Gouvernance | Statut · Département · Direction · Équipe · Chef de produit · Projet stratégique · Feuille de route · sous-bloc Fin de vie (dates) |
| Usagers & impact | Cibles · Volumétrie · Criticité · JDMA · Stats JDMA · Enjeux |
| Conformité | Homologation (+ dates) · RGAA · Besoins DICT (4 cases) |
| Technique & prestataires | Nature · Typologie · Hébergement · Site · Back-office · Dépôts · Marché · Prestataire · Éditeur |

Mapping champs / groupes : `src/utils/produitReferentiel.ts` (`groupe` ; `theme` conservé pour alignement sync app sœur).
UI : `ProduitReferentielInfosPanel`.
Composant partagé missions : `MissionEquipePrestationsPanel` (fiche mission en édition ; fiche produit sans CTA).
Tri / statut « en cours » : `missionsLieesAuProduit` + `isMissionEnCours` (`src/utils/produitsList.ts`) — statut vide = pas « en cours » (pas d’ouverture forcée).

## Hors scope

- Édition du produit / sync vers Grist
- Création / édition de prestations depuis la fiche produit (passer par la fiche mission)
- Onglets Prestations / Maturité (app sœur)
- Colonnes techniques hors périmètre sync (stack, SCORE hors RGAA sync, etc.)
