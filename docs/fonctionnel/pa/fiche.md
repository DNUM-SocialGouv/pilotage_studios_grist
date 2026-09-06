# Fiche plan d’activité — `/pa/:id`

[← Plan d’activité](README.md) › **Fiche**

## Objet

Détail d’un PA : métadonnées, récap financier, liste des BDC rattachés (liens vers `/bdc/:id`).

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/pa/:id` (`id` = row id Grist) |
| Page | `src/pages/PaDetailView.tsx` |
| Retour | Lien vers `/pa` |

## États

| État | UI |
|------|-----|
| PA introuvable | Alerte warning + retour liste |

(Les états embed / hors Grist / loading sont gérés en amont via le contexte partagé sur la liste ; la fiche suppose des données déjà hydratées ou affiche « introuvable ».)

## Contenu

- Métadonnées : année, bureau, priorité, responsable, domaine · sous-domaine
- `FinanceRecap` : enveloppe, engagé, payé Sofiane, reste à consommer
- Tableau **BDC rattachés** (full) : nom (lien fiche BDC), montant TTC, consommé CRA  
  Sans full : alerte « Accès limité »

## Liens croisés

Vers [`/bdc/:id`](../bdc/fiche.md) pour chaque BDC listé.
