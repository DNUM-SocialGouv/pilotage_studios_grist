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

Mission (lien `/missions/:id`, expand si enfants), produit (texte), équipe (`EquipeBadges`), statut, responsable, date de début, jours CRA, montant TTC CRA. **Pas** de colonne Intervenant sur le master (le staffing vit sur les prestations dépliées). Le **filtre** Intervenant reste.

Si la mission a des **prestations** (`Missions_enfants`, rattachement via `Mission_parent` mappé à l’ingest), le chevron ouvre des **sous-lignes** dans la même grille (8 cellules, pas de mini-tableau, pas d’édition) :

| Colonne | Expand |
|---------|--------|
| Mission | Libellé prestation en gras (0,9rem) ; intervenant en dessous (`fr-hint-text`) s’il est distinct du libellé |
| Produit | Type de prestation (libellé lisible, ex. `Freelance_jours` → Freelance) |
| Équipe / Resp / Début | — |
| Statut | Texte de la prestation (même rendu que le master, pas concaténé avec le type) |
| Jours / Montant TTC | Agrégat CRA de **cette** prestation ; aucun CRA (`count === 0`) → — |

Écarts vs l’app sœur : pas d’export CSV, pas de badge statut, pas d’en-tête sticky.

## Récap CRA

Agrégats via `aggregateCraByMissionId` : `Realise.Mission_enfant` (ref vers la ligne enfant) → parent via `Mission_parent`, sinon `Realise.Missions`. Ne pas confondre avec le **texte** `Missions_enfants.Mission_enfant`.
