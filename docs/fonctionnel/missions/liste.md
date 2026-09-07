# Liste des missions — `/missions`

[← Missions](README.md) › **Liste**

## Objet

Parcourir les missions **master**, filtrer, déplier les prestations, ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions` |
| Page | `src/pages/MissionsListView.tsx` |
| Navigation | **Missions** (`WidgetNav`) |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Embed non autorisé | `NothingHerePage` |
| Hors Grist / API indisponible | `NothingHerePage` / alerte |
| Chargement connexion | « Connexion à Grist… » |
| Chargement missions | « Chargement des missions… » |
| Erreur fetch Missions | Alerte erreur (indépendant du chargement BDC) |
| Référentiels partiels | Alerte warning + tableau quand même |
| OK | Filtres + tableau |

## Filtres

Grille ISO app sœur, 2 lignes desktop (`fr-col-lg-4`) :

1. Recherche (nom de mission, libellé produit) · **équipe** · **département** (select simple)
2. **produits** · **statut** · **intervenant** (liste déroulante riche : multi-select, recherche interne, tout sélectionner / désélectionner)

Réinitialiser. Combinables (AND entre filtres, OR dans un multi-select). Liste vide = tous. Options dérivées des valeurs présentes dans les lignes chargées (produits / intervenants staffés uniquement).

## Colonnes

Mission (lien `/missions/:id`, expand si enfants), produit (texte), équipe (`EquipeBadges`), statut, intervenants (enfants + legacy), responsable, date de début, jours CRA, montant TTC CRA.

Lignes enfants : libellé prestation, type / statut, intervenant.

## Récap CRA

Agrégats via `aggregateCraByMissionId` : `Realise.Mission_enfant` → parent, sinon `Realise.Missions`.
