# Liste de l’équipe — `/equipe`

[← Équipe](README.md) › **Liste**

## Objet

Consulter les personnes du pilotage, filtrer, ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe` |
| Page | `src/pages/EquipeListView.tsx` (sous `EquipeLayout`) |
| Navigation | **Équipe** (`WidgetNav`) |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| OK | Filtres + tableau |

## Filtres

Recherche (champs visibles), **département**.  
**Statut** (défaut **Actif** si la colonne est lisible), **portage**, **rôle** : affichés seulement si au moins une valeur est lisible (sinon masqués — cas Freelance / ACL).

Si `Statut` est illisible, aucun filtre Actif n’est appliqué (évite une liste vide).

## Colonnes

Toujours : Nom (lien), département.  
Conditionnelles : portage, statut, spécialité, rôle — seulement si lisibles via Access Rules.
