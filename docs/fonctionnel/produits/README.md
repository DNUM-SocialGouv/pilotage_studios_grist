# Produits

[← Documentation](../../README.md) › **Produits**

> **Routes** : `/produits`, `/produits/:id`  
> **Issue** : [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3)

## Objet métier

Le **catalogue Produits** reprend le référentiel SDPC (table Grist `Tableau_de_pilotage_SDPC_Produits_SDPC`). Le widget affiche une **liste** et une **fiche** en consultation. Pas d’édition depuis le widget.

Les missions pointent vers un produit (`Missions.Produit_SDPC`) : depuis la fiche produit,
l’onglet Missions reprend le bloc « Équipe & prestations » de chaque mission (lecture seule).

| Outil | Rôle |
|-------|------|
| **Grist** (catalogue SDPC) | Référentiel produit |
| **Ce widget** | Liste / fiche lecture (`ProduitsLayout`) |
| **App sœur** | Sync référentiel + onglets Prestations / Maturité (hors scope widget) |

## Données Grist

| Table | Usage |
|-------|--------|
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Liste et fiche (`fetchAllowlistedTable`) |
| `Missions` | Fiche uniquement : section Missions liées (`Produit_SDPC` = produit) |

Colonnes widget (liste) : `Produit`, `departement_sdpc`, `Statut_actuel`, `En_prod`, `Chef_de_produit`.

Filtre liste **investissement studio** (interrupteur, défaut activé) : s’appuie aussi sur `Missions` + `Missions_enfants` + `Realise` (jours ou TTC CRA &gt; 0). Détail : [liste.md](liste.md).

Colonnes fiche : périmètre **sync référentiel** (~37 champs, affichés en 5 groupes métier sur l’onglet Informations) + badges `En_prod` / `Obsolescence` / `Statut_cible` / `Type_de_produit` / `Description_longue` / liens FO & collab. Détail : [fiche.md](fiche.md), `src/utils/produitReferentiel.ts`.

**Hors scope widget** : édition catalogue, stack technique hors sync, PV, évaluations, onglets Prestations / Maturité.

Allowlist lecture : `src/security/fetchTableAllowlist.ts` (table déjà listée). Pas d’écriture catalogue.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|------|
| Liste | [liste.md](liste.md) | `/produits` |
| Fiche | [fiche.md](fiche.md) | `/produits/:id` |

Le drapeau de page Grist est `Page_produits` ([Droits des pages](../roles/droits-pages-admin.md)).

## Hors scope (widget)

- Création / modification d’un produit
- Sync différentielle (côté app sœur)
- Stack / SCORE hors champs sync affichés
- Procès-verbaux et évaluations
