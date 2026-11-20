# Projets de portage (Outils Admin)

[← Documentation fonctionnelle](../../README.md) › **Projets de portage**

> **Route** : `/outils/portage-projet`  
> **Accès** : Admin uniquement (`adminOnly` + `AdminRoleGuard`) — **hors `Page_*`**

## En clair

Les **Admin** peuvent ouvrir **Outils → Projets de portage** pour créer, corriger ou supprimer un **projet de portage** : un projet chez un porteur (souvent Malt), relié à une personne, un responsable et, si besoin, un bon de commande. Le porteur « Malt » le fait apparaître dans le choix **Projet Malt** d’une prestation.

On ne dit pas « mission » ici : une mission, dans le produit, c’est le lot d’accompagnement (écran Missions).

Règle : **une ligne = un projet chez un porteur, avec une personne, un responsable, et éventuellement un bon de commande**.

## Qui y accède

| Condition | Effet |
|-----------|--------|
| `Acl_profil.Role` = **Admin** | Lien nav Outils + page accessibles |
| Autre rôle | Lien masqué ; URL refusée (retour Accueil) |
| Preview hors iframe | Page accessible pour développer ; listes vides sans Grist |

Pas de drapeau `Page_*` : même modèle que Générer un devis (fixé par rôle Admin, rappel lecture seule dans « Fixés par rôle »).

Les règles d’accès Grist de la table ne sont pas modifiées par cet écran : un éditeur du document peut encore changer la grille Grist. Seul le widget réserve l’écran aux admins.

## Parcours

1. **Liste** — nom, personne, porteur, statut, bon de commande ; recherche ; pages de 10 lignes.
2. **Panneau** — créer ou modifier les dix champs de la table (nom obligatoire).
3. **Supprimer** — confirmation. Refusée si une prestation pointe encore vers le projet.

Une cellule ancienne illisible s’affiche « valeur à corriger ». Elle n’est pas réécrite tant qu’une nouvelle valeur n’est pas choisie.

## Données

| Table | Usage |
|-------|--------|
| `Portage_Projet` | Liste + création, modification, suppression (une ligne) |
| `Equipe` | Listes Personne et Responsable (lecture) |
| `BDC` | Liste Bon de commande (déjà chargée avec les plans d’activité) |
| `Prestations` | Compte les rattachements avant suppression (lecture) |

## Hors scope

- Pas d’interrupteur `Page_*`, pas de changement des Access Rules.
- Pas d’import, pas de suppression en masse, pas de création de bon de commande depuis cet écran.
