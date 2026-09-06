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

Recherche (nom, financeur, n° Chorus, statut, plateforme, libellé PA, équipe), **statut**, **financeur**. Réinitialiser. Combinables.

Options statut / financeur dérivées des valeurs présentes dans les lignes chargées.

## Colonnes

Nom (lien `/bdc/:id`), PA (lien `/pa/:id` ou `—`), statut, financeur, budget TTC, consommé CRA, solde CRA (`montantReste`).
