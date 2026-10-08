# Liste des missions — `/missions`

[← Missions](README.md) › **Liste**

## Objet

Parcourir les missions **master** (lots), filtrer, basculer entre **liste détaillée** et **kanban** (par statut), ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions` |
| Page | `src/pages/MissionsListView.tsx` |
| Navigation | **Missions** (`WidgetNav`) |
| Pagination | 10 lots par page **en liste détaillée uniquement** (off en kanban) |

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

Réinitialiser hors accordéon **uniquement si au moins un filtre est actif**. Combinables (AND entre filtres, OR dans un multi-select). Options dérivées des valeurs présentes.

### Vue « nouvelles demandes »

`/missions?vue=nouvelles-demandes` pré-sélectionne les statuts **A instruire** et **En investigation**.

## Deux lectures

Contrôle segmenté DSFR (`fr-segmented--sm`), préférence `localStorage` `pilotage.missions.listeVue` (`detail` \| `kanban` ; legacy `lot` lu comme `kanban`) :

| Vue | Contenu |
|-----|---------|
| **Liste détaillée** (défaut) | Tableau 3 niveaux : lot → prestation → CRA |
| **Kanban** | Colonnes selon `Missions.Statut` ; carte = lot ; clic → fiche |

Jours / Montant TTC d’un **lot** = somme des CRA de ses **prestations** uniquement (`—` s’il n’y a aucune ligne CRA, pas `0`). Pas d’UI « CRA hors prestation » dans la hiérarchie (filtre Staffing seulement).

### Liste détaillée — colonnes

| Colonne | Lot | Prestation | CRA |
|---------|-----|------------|-----|
| Mission | Lien `/missions/:id` + badge nb prestations | Libellé + badge CRA ; meta équipe + intervenant | Période mois/année + tâches |
| Produit | Lien `/produits/:id` | — | — |
| Statut | Badge `noIcon` | Badge propre | — |
| Début | `formatGristMonthYear` | — | — |
| Jours / TTC | Σ CRA prestations | CRA prestation | ligne CRA |
| Actions | **Ouvrir** + **Modifier** (drawer) | — | — |

Pas de colonnes Équipe / Resp au niveau lot. Lot sans prestation : **pas de chevron**.

### Kanban (par statut)

Shell commun avec Weekly Ops (`KanbanBoard` / `KanbanCardShell`) — **sans** sync `Weekly_phase` ↔ `Missions.Statut`.

| Élément | Détail |
|---------|--------|
| Colonnes défaut | **A instruire** · **En investigation** · **En cours** |
| Colonne En cours | Cumule `En cours` + `Récurrent` + `Suivi et amélioration continue` ; drop → écrit `En cours` |
| Terminé / Annulé / [Archivée] | Masqués par défaut ; toggle « Afficher terminées / annulées / archivées » **ou** filtre statut |
| Autres | Colonne dédiée si présents dans le filtre ; **Autre** si statut vide |
| Carte | Titre · produit · jours · montant · tags équipes |
| Clic | → `/missions/:id` |
| Drag / menu | Change `Missions.Statut` (même droit que Modifier) + menu clavier « Déplacer vers… » |
| Pagination | **Off** |

## Création et modification (drawer unique)

Bouton **« Nouvelle mission »** sous le titre → `MissionFormDrawer` mode **create** (statut par défaut « A instruire »). **Modifier** depuis la liste détaillée ou le menu kanban → mode **edit**.

Champs : **Nom** (obligatoire) · **Produit (SDPC)** · **Statut**. Largeur fixe **SM** (pas de sélecteur de largeur côté widget).

**Create** — section optionnelle **première prestation**, deux parcours **exclusifs** :

1. **Réaffecter** (migration / découpage) : **Mission source** puis **Prestation existante** (enfants de cette mission uniquement) → après création du lot, `Missions_enfants.Mission_parent` pointe vers le nouveau lot.
2. **Créer** : titre + intervenant + jours envisagés → nouvelle ligne `Missions_enfants` (`Mission_parent`, `Titre_de_la_prestation`, `Intervenant`, …).

Succès total → redirection `/missions/:id`. Mission créée mais prestation (create ou réaffectation) en échec → avertissement + lien fiche (pas de redirect).

**Edit** — pas de champs prestation ; lien vers onglet Équipe & prestations. Succès → Alert in-drawer (drawer reste ouvert).

Composant : `src/components/missions/MissionFormDrawer.tsx` — écriture via `missionGristWrite.ts` (plugin API Grist).

## Écarts volontaires vs app sœur

- Pas d’ajout prestation depuis la liste (drawer enfant)
- Pas d’export CSV ni rapport d’investissement
- Vue « Par lot » (bandeaux) **retirée** au profit du kanban

## Récap CRA

Agrégats via `aggregateCraByEnfantId` / `totauxCraDuLot` : `Realise.Mission_enfant` (ref) → prestation. Équipe prestation = `Equipe` de l’intervenant, pas `Missions.Equipe2`.

## Droits / `Page_*`

**N/A `Page_*`** — variante d’affichage sur l’écran Missions déjà listé (pas de nouvel écran ni garde). Drag statut = même écriture `Missions` déjà allowlistée (drawer).
