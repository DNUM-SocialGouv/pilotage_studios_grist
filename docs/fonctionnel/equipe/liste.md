# Liste de l’équipe — `/equipe`

[← Équipe](README.md) › **Liste**

## Objet

Consulter les personnes du pilotage, filtrer, ouvrir une fiche. Les **Admin** peuvent aussi **ajouter une personne**.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe` |
| Page | `src/pages/EquipeListView.tsx` (sous `EquipeLayout`) |
| Navigation | **Équipe** (`WidgetNav`) |
| Pagination | 10 lignes |
| Création | Bouton **Nouvelle personne** (Admin / preview standalone) → drawer `EquipeFormDrawer` |

## Création (Admin)

Panneau latéral (drawer SM) : Prénom Nom *, E-mail *, Département, Spécialité, Statut (défaut Actif), Portage, Ordinateur, Mode de recrutement, Rôle, TJM (optionnel).

Après enregistrement : rechargement de la liste et ouverture de `/equipe/:id`.

Les freelances (et autres non-Admin) ne voient pas le bouton. Un **Owner** du document qui n’a pas le rôle Admin dans Équipe peut créer côté Grist (Access Rules) mais ne voit pas le bouton widget — aligné sur les autres écrans Admin. La sécurité réelle reste les Access Rules Grist (Owner / Admin seuls peuvent créer).

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| OK | Filtres + tableau (+ bouton Admin si applicable) |

## Filtres

Bloc **accordéon** (même shell que Missions / CRA) : recherche + listes déroulantes sur **deux colonnes** (deux lignes en Admin).

Recherche (champs visibles), **département**.  
**Statut** (défaut **Actif** si la colonne est lisible), **portage**, **rôle** : affichés seulement si au moins une valeur est lisible (sinon masqués — cas Freelance / ACL).

Si `Statut` est illisible, aucun filtre Actif n’est appliqué (évite une liste vide).

## Colonnes

Toujours : avatar Glyphs + Nom (lien unique sur les deux), département (tag coloré comme Missions).  
Conditionnelles : portage, statut, spécialité, rôle — seulement si lisibles via Access Rules.

L’avatar utilise le seed `Equipe.Avatar` (DiceBear Glyphs) ; si vide, repli stable `equipe-{id}`. Si l’image ne charge pas, un placeholder gris conserve l’emprise.
