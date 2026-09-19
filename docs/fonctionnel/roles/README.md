# Rôles et droits Grist — Pilotage studio (V2)

Documentation **métier / ACL** (*Access Control List* = règles de qui peut faire quoi) du document Grist `nei9DeARs5Eo` (Pilotage studio V2). Complète [`SECURITY.md`](../../../SECURITY.md).

**Statut (2026-09-18)** : inventaire anonymisé · `Equipe.Role_ACL` · User Attribute `Equipe` **fait** · pont `Acl_profil` + UX nav/gardes **fait** · Access Rules par rôle métier sur CRA **plus tard**.

> **Repo public** — ne jamais committer de listes nominatives (noms, emails, inventaires `/access`). Utiliser le MCP en local ; ne garder dans `docs/` que des agrégats.

## En clair

On gère les droits en **plusieurs couches** (invitation au document, rôle dans Equipe, règles Grist, menus du widget). Le tableau de suivi à jour est la **[matrice](matrice-droits.md)** : à renseigner à chaque feature ou changement de permissions.

## Les 6 couches (aperçu)

| # | Couche | Intention |
|---|--------|-----------|
| 1 | Partage document | Qui peut ouvrir le document |
| 2 | Rôle ACL (`Equipe.Role_ACL`) | Qui est Admin / Resp. / Freelance / Invité |
| 3 | Propriété d’utilisateur | Relier email de connexion → fiche Equipe |
| 4 | Pont widget | `Acl_profil` (rôle + `Page_*` ← `Droits_pages`) |
| 5 | UX widget | Masquer menus / bloquer pages (confort) |
| 6 | Access Rules tables | Protéger les données (vrai contrôle) |

Détail + tableaux A/B + journal : **[matrice-droits.md](matrice-droits.md)**.  
Schéma canvas (IDE) : `roles-droits-schema.canvas.tsx`.

## Documents de ce module

| Fichier | Contenu |
|---------|---------|
| **[matrice-droits.md](matrice-droits.md)** | **Registre vivant** — écrans × rôles, tables × rôles, journal |
| [droits-pages-admin.md](droits-pages-admin.md) | Page Admin `/outils/droits-pages` (édition `Droits_pages`) |
| [access-rules.md](access-rules.md) | Snapshot ACL Grist + procédure |
| [inventaire-partage.md](inventaire-partage.md) | Synthèse anonymisée du partage |
| [prep-equipe.md](prep-equipe.md) | Colonne Role + backlog emails |
| [widget-ux.md](widget-ux.md) | UX widget selon rôle |
| `private/` *(gitignoré)* | Inventaire nominatif local |

## Rôles cibles (`Equipe.Role_ACL`)

| Valeur Choice | Intention |
|---------------|-----------|
| Admin | Pilotage complet + tables budgétaires |
| Responsable de département | Périmètre de son `Equipe` (département) |
| Freelance | Périmètre limité (ses lignes / missions / CRA) |
| Invité | Lecture très restreinte |

## Prérequis matching email

User Attribute **configuré** : Name `Equipe`, `user.Email` → `Equipe.E_mail` → `user.Equipe.Role_ACL`, etc.

Sans email renseigné dans `Equipe`, pas de match → pas de rôle résolu.

## Hors scope

- Se fier au masquage widget **à la place** des Access Rules pour les données sensibles
- Écriture programmatique des Access Rules via API (risque lock-out)
- Remplir automatiquement tous les emails manquants (données RH / Owner)
