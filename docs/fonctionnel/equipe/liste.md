# Liste de l’équipe — `/equipe`

[← Équipe](README.md) › **Liste**

## Objet

Consulter les personnes du pilotage, filtrer, ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe` |
| Page | `src/pages/EquipeListView.tsx` |
| Navigation | **Équipe** (`WidgetNav`) |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| OK | Filtres + tableau |

## Filtres

Recherche (nom, département, portage, spécialité, rôle), **statut** (défaut **Actif**), **département**, **portage**, **rôle**. Lien **Réinitialiser les filtres** visible seulement si au moins un filtre diffère du défaut (revient au statut Actif). Combinables.

## Colonnes

Nom (lien `/equipe/:id`), département, portage, statut, spécialité, rôle.
