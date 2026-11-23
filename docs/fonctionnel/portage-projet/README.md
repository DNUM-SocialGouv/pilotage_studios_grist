# Portage (Outils Admin)

[← Documentation fonctionnelle](../../README.md) › **Portage**

> **Route** : `/outils/portage-projet`  
> **Accès** : Admin uniquement (`adminOnly` + `AdminRoleGuard`) — **hors `Page_*`**

## En clair

Les **Admin** peuvent ouvrir **Outils → Portage** pour créer, corriger ou supprimer un **portage** : un projet chez un porteur (souvent Malt), relié à une personne, un responsable et, si besoin, un bon de commande. Le porteur « Malt » le fait apparaître dans le choix **Projet Malt** d’une prestation.

On ne dit pas « mission » ici : une mission, dans le produit, c’est le lot d’accompagnement (écran Missions).

Règle : **une ligne = un portage chez un porteur, avec une personne, un responsable, et éventuellement un bon de commande**.

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
2. **Panneau** — créer ou modifier le portage (nom obligatoire). Sous la liste des bons de commande, **Créer un bon de commande** demande le nom, le statut, le montant TTC et, si on l’a, le numéro Chorus. Rien n’est écrit tant que le portage n’est pas enregistré. Le financeur du portage est recopié. Si le porteur est Malt, la plateforme du bon de commande est Malt. Le plan d’activité, l’équipe et le lien Sofiane se complètent ensuite sur la fiche du bon de commande.
3. **Supprimer** — confirmation. Les prestations liées sont relues au clic, puis encore juste avant l’effacement. Refusée si une prestation pointe encore vers le portage, ou si cette relecture échoue.
4. **Importer** — dépôt d’un tableau CSV. Chaque ligne est vérifiée (nom nouveau, personne et bon de commande reconnus ou vides, dates cohérentes). Le numéro de ligne est celui du fichier. Le bon de commande est reconnu par son nom ou par « Chorus » suivi du numéro. Seules les lignes prêtes sont créées, une par une. Fermer le panneau arrête les créations qui n’ont pas encore commencé. Un portage déjà présent n’est pas réécrit. Un fichier sans ligne est refusé.

Une cellule ancienne illisible s’affiche « valeur à corriger ». Elle n’est pas réécrite tant qu’une nouvelle valeur n’est pas choisie.

## Données

| Table | Usage |
|-------|--------|
| `Portage_Projet` | Liste + création, modification, suppression (une ligne) + import CSV après vérification |
| `Equipe` | Listes Personne et Responsable (lecture) |
| `BDC` | Liste Bon de commande, et création courte depuis le panneau (nom, statut, montant, Chorus) |
| `Prestations` | Compte les rattachements avant suppression (lecture) |

## Hors scope

- Pas d’interrupteur `Page_*`, pas de changement des Access Rules.
- Pas de mise à jour ni de suppression en masse.
- Pas de création du bon de commande depuis la liste ou la fiche des bons de commande, et pas de suppression d’un bon de commande.
- Le plan d’activité, l’équipe, le lien Sofiane et le devis ne se saisissent pas dans ce panneau.
