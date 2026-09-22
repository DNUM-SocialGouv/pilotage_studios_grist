# Fiche produit — `/produits/:id`

[← Produits](README.md) › **Fiche**

## Objet

Voir l’essentiel d’un produit du catalogue SDPC, en lecture seule, et les missions qui y sont rattachées.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/produits/:id` |
| Page | `src/pages/ProduitsDetailView.tsx` (sous `ProduitsLayout`) |
| Retour | Lien vers `/produits` |
| Issue | [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3) |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Produit introuvable » + retour liste |
| OK | Badges · titre · bandeau · description · liens · missions liées |

## Affichage

| Zone | Contenu |
|------|---------|
| Badges | Statut actuel · En production (si vrai) · Obsolescence (si vrai) |
| Titre | Libellé `Produit` |
| Bandeau | Département · type · chef de produit · équipe produit · statut cible (si renseignés) |
| Description | `Description`, sinon `Description_longue` |
| Liens | URLs http(s) produit / FO / BO / espace collab (nouvel onglet) |
| Section | **Missions liées** : Nom (lien `/missions/:id`) · Statut |

### Missions liées

- Source : table `Missions` (chargement lazy sur la fiche uniquement).
- Filtre : `Produit_SDPC` = id du produit.
- Pagination 10. Pas de prestations / CRA sur cette page.
- On n’affiche que ce que Grist laisse déjà lire.

## Hors scope

- Édition du produit
- Colonnes techniques (SCORE, RGAA, stack…)
