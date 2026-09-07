# Bons de commande (BDC)

[← Documentation](../../README.md) › **Bons de commande**

> **Routes** : `/bdc`, `/bdc/:id`  
> **Studio** : Tech  
> **Livré** : [PR #2](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/pull/2)

## Objet métier

Consultation **lecture seule** des bons de commande Grist dans l’iframe : récap financier (KPI + barre % consommé), onglets Dépenses / Informations / PV (stub), rattachement PA.

| Outil | Rôle |
|-------|------|
| **Grist** (`BDC`, refs `PA`, `Equipe2`…) | Référentiel |
| **Ce widget** | Liste / fiche BDC |
| **App sœur** | Création / édition, devis, suivi CRA drawers — [doc BDC app](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/bdc/README.md) |

## Données Grist

| Table | Usage |
|-------|--------|
| `BDC` | Lignes liste / fiche (REST + token read-only) |
| `Plan_activite` | Libellés PA + lien croisé |
| `Constatations`, `Commandes_Sofiane` | Cascade PA affichée sur la fiche (reste à consommer du PA lié) |
| `Realise` | Onglet Dépenses — lignes CRA du BDC (REST filtrée, fiche uniquement) |
| `Missions`, `Missions_enfants` | Hiérarchie tableau Dépenses |
| `Equipe` | Libellés intervenants |
| `Tableau_de_pilotage_SDPC_Produits_SDPC` | Libellés / camembert TTC par produit |

**Accès full obligatoire** pour charger `BDC` : sinon alerte « Accès multi-tables indisponible ».

## Règles d’affichage

- Montants EUR (`formatMontantEur`) ; vide → `—`
- Fiche : récap hors onglets ; onglets Dépenses (lecture), Informations, PV (stub)
- Liste : soldes négatifs en rouge (`montantReste`)
- Équipe : tokens via `extractGristStringTokens(Equipe2)` ; badges couleur stables (`EquipeBadges` / `equipeBadgeClass`)
- Ref PA : `bdcPaRefId` / `extractGristReferenceId`

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/bdc` |
| Fiche | [fiche.md](fiche.md) | `/bdc/:id` |

## Écarts vs l’app

- Pas d’écriture Grist, pas de drawer création / devis / suivi mensuel
- Onglet PV stub (écran `/pv` pas encore livré)
- Pas de mini-donut conso/budget ni page `/cra` transversale
- Select Data reste `Plan_activite` (ancre) — pas de reconfig pour BDC
