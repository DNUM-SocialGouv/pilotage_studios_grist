# Bons de commande (BDC)

[← Documentation](../../README.md) › **Bons de commande**

> **Routes** : `/bdc`, `/bdc/:id`  
> **Studio** : Tech  
> **Livré** : [PR #2](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/pull/2)

## Objet métier

Consultation **lecture seule** des bons de commande Grist dans l’iframe : budget TTC, consommé CRA, solde CRA, rattachement PA.

| Outil | Rôle |
|-------|------|
| **Grist** (`BDC`, refs `PA`, `Equipe2`…) | Référentiel |
| **Ce widget** | Liste / fiche BDC |
| **App sœur** | Création / édition, devis, suivi CRA drawers — [doc BDC app](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/bdc/README.md) |

## Données Grist

| Table | Usage |
|-------|--------|
| `BDC` | Lignes liste / fiche (`fetchAllowlistedTable`) |
| `Plan_activite` | Libellés PA + lien croisé |
| `Constatations`, `Commandes_Sofiane` | Cascade PA affichée sur la fiche (reste à consommer du PA lié) |

**Accès full obligatoire** pour charger `BDC` : sinon alerte « Accès multi-tables indisponible ».

## Règles d’affichage

- Montants EUR (`formatMontantEur`) ; vide → `—`
- Solde CRA / restes négatifs en rouge (`montantReste`)
- Équipe : tokens texte via `extractGristStringTokens(Equipe2)`
- Ref PA : `bdcPaRefId` / `extractGristReferenceId`

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/bdc` |
| Fiche | [fiche.md](fiche.md) | `/bdc/:id` |

## Écarts vs l’app

- Pas d’écriture Grist, pas de drawer création / devis / suivi mensuel
- Pas de mini-donut conso/budget ni page `/cra` transversale
- Select Data reste `Plan_activite` (ancre) — pas de reconfig pour BDC
