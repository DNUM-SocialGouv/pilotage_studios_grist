# Fiche produit — `/produits/:id`

[← Produits](README.md) › **Fiche**

## Objet

Voir un produit du catalogue SDPC en lecture seule : identité (hero type Mon carnet),
référentiel SDPC (~37 champs sync), et missions rattachées.

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
| OK | Hero · référentiel · missions liées |

## Affichage

### Hero (style Mon carnet)

| Zone | Contenu |
|------|---------|
| Titre | Libellé `Produit` |
| Sous-titre | `Description` si distincte du nom (nom complet) |
| Badges | Statut actuel · Statut cible · En production · Obsolescence |
| Meta | Département · direction métier (`D_Metier`) · type |
| Chef | `Chef_de_produit` |
| Liens rapides | Site (`URLs_du_produit` ou FO) · espace collab. |

### Référentiel SDPC

Lecture seule. Indicateurs : champs non remplis + taux de complétion (calcul UI sur les
37 champs sync, pas les formules Grist source).

| Bloc | Contenu |
|------|---------|
| Essentiel — identité | Toujours visible : 11 champs (nom, statut, équipe, URLs, dépôts, feuille de route…) |
| Accordéons | Sécurité et conformité · Utilisateurs et exploitation · Cycle de vie |
| Description longue | `Description_longue` si renseignée (hors compteur sync) |

Mapping et libellés : `src/utils/produitReferentiel.ts` (aligné sync app sœur).

### Missions liées

- Source : table `Missions` (chargement lazy sur la fiche uniquement).
- Filtre : `Produit_SDPC` = id du produit.
- Colonnes : Nom (lien `/missions/:id`) · Statut. Pagination 10.
- On n’affiche que ce que Grist laisse déjà lire.

## Hors scope

- Édition du produit / sync vers Grist
- Onglets Prestations / Maturité (app sœur)
- Colonnes techniques hors périmètre sync (stack, SCORE hors RGAA sync, etc.)
