# Droits des pages (Admin)

[← Rôles & droits](README.md) › **Droits des pages**

> **Route** : `/outils/droits-pages`  
> **Issue** : [#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54)

## En clair

Les **Admin** peuvent ouvrir **Outils → Droits des pages** pour activer ou désactiver, rôle par rôle (interrupteurs), quels écrans apparaissent dans le menu du widget (Budget, Missions, Équipe…). Chaque interrupteur s’enregistre **immédiatement** dans Grist. C’est du **confort de menu** : ça ne verrouille pas les données.

Une section **Fixés par rôle** rappelle en lecture seule les écrans dont l’accès ne se règle pas ici (Mon carnet, Weekly, Revue CRA équipe, cette page elle-même).

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

Budget · Outils · Missions · Équipe · Produits · Accueil — **un tableau par thème** (titre + interrupteurs DSFR), puis **Fixés par rôle** (Oui/Non lecture seule). Détail dans la matrice ([matrice-droits.md](matrice-droits.md)).

| Section | Contenu |
|---------|---------|
| Budget | BDC, PA, Prestation/CRA, PV (`Page_*`) |
| Outils | Règles métier (`Page_regles_metier`) · Récap porteurs (`Page_recap_porteurs`) |
| Missions / Équipe / Produits / Accueil | `Page_missions`, `Page_equipe`, `Page_produits`, `Page_accueil` |
| Fixés par rôle | Mon carnet · Revue CRA équipe · Weekly · Droits des pages (hors `Page_*`) |

### Nouvelle colonne `Page_regles_metier`

HITL Owner **OK pour créer** (2026-10-03). Création **UI Grist uniquement** — procédure : [page-regles-metier-owner.md](page-regles-metier-owner.md). Valeurs par défaut : **oui** pour les 4 rôles.

## Hors scope

- Access Rules sur les tables (couche 6, [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55))
- Création / suppression de rôles ou de colonnes `Page_*` (HITL Owner + revue agents — rule `roles-matrice`)
- Interrupteurs pour Mon carnet / Revue CRA / Droits des pages (accès par rôle)
