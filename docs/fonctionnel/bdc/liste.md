# Liste des bons de commande — `/bdc`

[← Bons de commande](README.md) › **Liste**

## Objet

Parcourir les BDC, filtrer, ouvrir une fiche ; lien vers le PA rattaché.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/bdc` |
| Page | `src/pages/BdcListView.tsx` |
| Navigation | Entrée **BDC** de `WidgetNav` |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Embed non autorisé | Alerte erreur |
| Hors Grist / API indisponible | Alerte info |
| Chargement connexion | « Connexion à Grist… » |
| Erreur | Alerte erreur |
| Accès multi-tables denied / error | Alerte warning (besoin **full**) |
| Chargement BDC (related idle/loading) | « Chargement des BDC… » |
| OK (`relatedStatus === ok`) | Filtres + tableau |

## Filtres

Recherche (placeholder : nom, financeur, n° Chorus, PA, équipe…), **statut**, **financeur**, **équipe**. Réinitialiser. Combinables.

Options statut / financeur / équipe dérivées des valeurs présentes dans les lignes chargées. Filtre équipe : le BDC est conservé s’il contient au moins le token sélectionné (`Equipe2`).

## Colonnes

Nom (lien `/bdc/:id`), PA (lien `/pa/:id` ou `—`), plateforme, statut, équipe (badges couleur via `EquipeBadges` / `equipeBadgeClass`), financeur, budget TTC, consommé CRA, solde CRA (`montantReste`).
