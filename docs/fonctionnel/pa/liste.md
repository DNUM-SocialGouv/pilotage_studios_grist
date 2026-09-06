# Liste des plans d’activité — `/pa`

[← Plan d’activité](README.md) › **Liste**

## Objet

Consulter les PA, filtrer, lire le récap financier filtré et ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/pa` |
| Page | `src/pages/PaListView.tsx` |
| Navigation | Entrée **PA** de `WidgetNav` |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Embed non autorisé | Alerte erreur |
| Hors Grist / API indisponible | Alerte info |
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| OK | Filtres + récap + tableau |

## Filtres

Recherche (libellé, domaine, sous-domaine, responsable, priorité), **année**, **bureau**, **priorité**. Bouton réinitialiser. Combinables.

## Colonnes

Activité (lien `/pa/:id`), année, bureau, priorité, enveloppe, engagé, reste à consommer (rouge si négatif via `montantReste`), nombre de BDC (si full).

## Récap

Totaux sur les PA **filtrés** : enveloppe, engagé, payé Sofiane, reste à consommer (`FinanceRecap`) — valeurs réduites si accès multi-tables indisponible.
