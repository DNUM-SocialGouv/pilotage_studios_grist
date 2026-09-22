# Produits

[← Documentation](../../README.md) › **Produits**

> **Routes** : `/produits`, `/produits/:id`  
> **Issue** : [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3)

## Objet métier

Le **catalogue Produits** reprend le référentiel SDPC (table Grist `Tableau_de_pilotage_SDPC_Produits_SDPC`). Le widget affiche une **liste** et une **fiche** en consultation. Pas d’édition depuis le widget.

Les missions pointent vers un produit (`Missions.Produit_SDPC`) : depuis la fiche produit, on voit les missions liées.

| Outil | Rôle |
|-------|------|
| **Grist** (catalogue SDPC) | Référentiel produit |
| **Ce widget** | Liste / fiche lecture (`ProduitsLayout`) |
| **App sœur** | Hors scope de ce livrable |

## Données Grist

| Table | Usage |
|-------|--------|
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Liste et fiche (`fetchAllowlistedTable`) |
| `Missions` | Fiche uniquement : section Missions liées (`Produit_SDPC` = produit) |

Colonnes widget (liste) : `Produit`, `departement_sdpc`, `Statut_actuel`, `En_prod`, `Chef_de_produit`.

Colonnes fiche en plus : `Description` / `Description_longue`, `Statut_cible`, `Type_de_produit`, `Equipe`, URLs (`URLs_du_produit`, FO/BO, espace collab), `Obsolescence`.

**Hors scope widget** : colonnes techniques SCORE / RGAA / technos, écriture, PV, évaluations.

Allowlist lecture : `src/security/fetchTableAllowlist.ts` (table déjà listée). Pas d’écriture catalogue.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/produits` |
| Fiche | [fiche.md](fiche.md) | `/produits/:id` |

Le drapeau de page Grist est `Page_produits` ([Droits des pages](../roles/droits-pages-admin.md)).

## Hors scope (widget)

- Création / modification d’un produit
- SCORE, RGAA, stack technique, homologation
- Procès-verbaux et évaluations
