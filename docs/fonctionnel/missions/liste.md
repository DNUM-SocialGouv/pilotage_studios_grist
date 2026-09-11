# Liste des missions — `/missions`

[← Missions](README.md) › **Liste**

## Objet

Parcourir les missions **master** (lots), filtrer, basculer entre deux lectures de la hiérarchie lot → prestation → CRA, ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions` |
| Page | `src/pages/MissionsListView.tsx` |
| Navigation | **Missions** (`WidgetNav`) |
| Pagination | 10 lots par page |

## États

| État | UI |
|------|-----|
| Embed non autorisé | `NothingHerePage` |
| Hors Grist / API indisponible | `NothingHerePage` / alerte |
| Chargement connexion | « Connexion à Grist… » |
| Chargement missions | « Chargement des missions… » |
| Erreur fetch Missions | Alerte erreur (indépendant du chargement BDC) |
| Référentiels partiels | Alerte warning + tableau quand même |
| OK | Filtres (accordéon) + toggle de vue + liste |

## Filtres

Accordéon **Filtres** (ouvert par défaut ; le titre indique le nombre de filtres actifs). Desktop : **deux lignes** de quatre colonnes (`fr-col-lg-3`) :

1. Recherche (mission ou produit) · **équipe** · **département** · **produits** (multi)
2. **statut** (multi) · **intervenant** (multi) · **Staffing** (Tous · Avec prestation · Sans prestation · CRA hors prestation)

Réinitialiser hors accordéon. Combinables (AND entre filtres, OR dans un multi-select). Options dérivées des valeurs présentes.

### Vue « nouvelles demandes »

`/missions?vue=nouvelles-demandes` pré-sélectionne les statuts **A instruire** et **En investigation**.

## Deux lectures (ISO app sœur #216 / #218 / #219)

Contrôle segmenté DSFR (`fr-segmented--sm`), préférence `localStorage` `pilotage.missions.listeVue` (`detail` \| `lot`) :

| Vue | Contenu |
|-----|---------|
| **Liste détaillée** (défaut) | Tableau 3 niveaux : lot → prestation → CRA |
| **Par lot** | Bandeau par lot (KPI + timeline équipes) ; tableau prestations à l’ouverture |

Jours / Montant TTC d’un **lot** = somme des CRA de ses **prestations** uniquement (`—` s’il n’y a aucune ligne CRA, pas `0`). Pas d’UI « CRA hors prestation » dans la hiérarchie (filtre Staffing seulement).

### Liste détaillée — colonnes

| Colonne | Lot | Prestation | CRA |
|---------|-----|------------|-----|
| Mission | Lien `/missions/:id` + badge nb prestations | Libellé + badge CRA ; meta équipe + intervenant | Période mois/année + tâches |
| Produit | Lien `/produits/:id` (stub) | — | — |
| Statut | Badge `noIcon` | Badge propre | — |
| Début | `formatGristMonthYear` | — | — |
| Jours / TTC | Σ CRA prestations | CRA prestation | ligne CRA |
| Actions | **Ouvrir** (fiche) | — | — |

Pas de colonnes Équipe / Resp au niveau lot. Lot sans prestation : **pas de chevron**.

### Par lot

Bandeau 2 colonnes : chevron + titre + statut + produit ; KPI + **timeline** (`background-action-low`) + tags équipe. Expand → Prestations / Équipe / Intervenant / Statut / Jours / TTC → CRA. Menu **Actions** : uniquement **Ouvrir la fiche** (lecture seule widget). Lot sans prestation : « Aucune prestation ».

## Écarts volontaires vs app sœur

- Pas de création / édition / ajout de prestation (drawers)
- Pas d’export CSV ni rapport d’investissement
- Lecture seule Grist

## Récap CRA

Agrégats via `aggregateCraByEnfantId` / `totauxCraDuLot` : `Realise.Mission_enfant` (ref) → prestation. Équipe prestation = `Equipe` de l’intervenant, pas `Missions.Equipe2`.
