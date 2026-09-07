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

Recherche (nom de mission, libellé produit), **statut**, **équipe**. Réinitialiser. Combinables.

Options statut / équipe dérivées des valeurs présentes dans les lignes chargées.

## Colonnes

Mission (lien `/missions/:id`, expand si enfants), produit (texte), équipe (`EquipeBadges`), statut, intervenants (enfants + legacy), responsable, date de début, jours CRA, montant TTC CRA.

Lignes enfants : libellé prestation, type / statut, intervenant.

## Récap CRA

Agrégats via `aggregateCraByMissionId` : `Realise.Mission_enfant` → parent, sinon `Realise.Missions`.
