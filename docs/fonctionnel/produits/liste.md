# Liste des produits — `/produits`

[← Produits](README.md) › **Liste**

## Objet

Parcourir le catalogue SDPC, filtrer, ouvrir une fiche.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/produits` |
| Page | `src/pages/ProduitsListView.tsx` (sous `ProduitsLayout`) |
| Navigation | **Produits** (`WidgetNav`) |
| Pagination | 10 lignes |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| OK | Filtres + tableau |

## Filtres

Bloc **accordéon** (même shell que Missions / Équipe) : recherche + listes déroulantes.

| Filtre | Comportement |
|--------|----------------|
| Recherche | Nom, département, statut, chef de produit |
| Département | Valeurs présentes |
| Statut actuel | Valeurs présentes |
| En production | Tous · Oui · Non — **défaut Oui** dès le premier affichage s’il existe au moins un produit en prod (pas de flash catalogue complet) |

Réinitialiser hors accordéon **uniquement si au moins un filtre est actif** (écart au défaut En production compte).

## Colonnes

| Colonne | Affichage |
|---------|-----------|
| Produit | Lien `/produits/:id` |
| Département | Tag couleur studio si renseigné |
| Statut actuel | Texte |
| En production | Badge Oui / Non (ou —) |
| Chef de produit | Texte |
