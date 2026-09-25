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
| Référentiels CRA partiels | Alerte warning (filtre investissement peut être incomplet) |

## Données chargées

Catalogue `Tableau_de_pilotage_SDPC_Produits_SDPC` **et**, pour le filtre investissement : `Missions`, `Missions_enfants`, `Realise` (pas `Equipe`).

## Filtres

Bloc **accordéon** (même shell que Missions / Équipe) : recherche + interrupteur + listes déroulantes.

| Filtre | Comportement |
|--------|----------------|
| Recherche | Nom, département, statut, chef de produit |
| Afficher uniquement les produits avec investissement studio | Interrupteur — **activé par défaut** ; produit gardé si jours CRA &gt; 0 **ou** TTC CRA &gt; 0 (via mission / prestation) |
| Département | Valeurs présentes |
| Statut actuel | Valeurs présentes |

Réinitialiser hors accordéon **uniquement si au moins un filtre est actif** (interrupteur désactivé compte ; l’état activé = défaut).

## Colonnes

| Colonne | Affichage |
|---------|-----------|
| Produit | Lien `/produits/:id` |
| Département | Tag couleur studio si renseigné |
| Statut actuel | Texte |
| En production | Badge Oui / Non (ou —) — drapeau catalogue, distinct du filtre investissement |
| Chef de produit | Texte |
