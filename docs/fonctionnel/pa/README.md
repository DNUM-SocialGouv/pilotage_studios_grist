# Plan d’activité (PA)

[← Documentation](../../README.md) › **Plan d’activité**

> **Routes** : `/pa`, `/pa/:id`  
> **Studio** : Tech

## Objet métier

Le **plan d’activité (PA)** est l’enveloppe budgétaire Sofiane d’une activité. Les **bons de commande** y sont rattachés. Le widget affiche enveloppe, engagé, payé Sofiane et **reste à consommer** (lecture seule).

| Outil | Rôle |
|-------|------|
| **Grist** (`Plan_activite`, `BDC`, `Constatations`, `Commandes_Sofiane`) | Référentiel |
| **Ce widget** | Liste / fiche PA dans l’iframe — **lecture seule** |
| **App sœur** | Import Sofiane, pilotage étendu — [doc PA app](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/pa/README.md) |

## Données Grist

| Table | Usage |
|-------|--------|
| `Plan_activite` | Ancre widget (`Select Data`) + hydratation `fetchAllowlistedTable` |
| `BDC` | Engagé / CRA (accès **full**) |
| `Constatations` | PV dans la cascade (full) |
| `Commandes_Sofiane` | Payé Sofiane / non rapprochées (full) |

Allowlist : `src/security/fetchTableAllowlist.ts`.

## Cascade financière (calculée dans le widget)

| Indicateur | Formule (accès full) |
|------------|----------------------|
| Enveloppe | `PA_Ajuste`, sinon `AE` |
| Engagé | somme `BDC.Montant_TTC` des BDC rattachés |
| Consommé CRA | somme `BDC.Total_TTC_CRA` |
| **Reste à consommer** | Enveloppe − Consommé CRA |
| Payé Sofiane | somme `Commandes_Sofiane.Montant_Paye` liées |

Sans accès full : enveloppe seule (`financePaOnly`) ; colonnes BDC / engagé affichés « — » ou 0 selon l’écran.

Code : `src/utils/paFinance.ts`.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/pa` |
| Fiche | [fiche.md](fiche.md) | `/pa/:id` |

## Hors scope (widget)

- Import CSV Sofiane (`/pa/import` app uniquement)
- Édition cellules Grist
- Alertes / filtres équipe avancés de l’app
