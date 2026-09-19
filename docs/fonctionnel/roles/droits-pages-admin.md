# Droits des pages (Admin)

[← Rôles & droits](README.md) › **Droits des pages**

> **Route** : `/outils/droits-pages`  
> **Issue** : [#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54)

## En clair

Les **Admin** peuvent ouvrir **Outils → Droits des pages** pour activer ou désactiver, rôle par rôle (interrupteurs), quels écrans apparaissent dans le menu du widget (Budget, Missions, Équipe…). Chaque interrupteur s’enregistre **immédiatement** dans Grist. C’est du **confort de menu** : ça ne verrouille pas les données.

## Qui y accède

| Condition | Effet |
|-----------|--------|
| `Acl_profil.Role` = **Admin** | Lien nav + page accessibles |
| Autre rôle | Lien masqué ; URL refusée (retour Accueil) |
| Preview hors iframe | Page accessible pour développer ; pas d’écriture Grist |

Pas de drapeau `Page_*` pour cet écran : un Admin ne peut pas se couper l’accès en désactivant une option.

## Données

| Table | Usage |
|-------|--------|
| `Droits_pages` | Lecture + mise à jour des cases `Page_*` (4 lignes = 4 rôles) ; écriture vérifiée par relecture |
| `Acl_profil` | Rechargé après chaque enregistrement pour rafraîchir le menu de l’Admin |

`Page_accueil` est affiché mais **non modifiable** (toujours oui).

Écriture Grist : compte **Owner** ou `Equipe.Role_ACL` = Admin (Access Rules). Sinon une alerte d’erreur s’affiche et l’interrupteur revient en arrière.

## Thématiques

Budget · Outils · Missions · Équipe · À venir · Accueil — **un tableau par thème** (titre + interrupteurs DSFR). Détail dans la matrice ([matrice-droits.md](matrice-droits.md)).

## Hors scope

- Access Rules sur les tables (couche 6, [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55))
- Création / suppression de rôles ou de colonnes `Page_*`
