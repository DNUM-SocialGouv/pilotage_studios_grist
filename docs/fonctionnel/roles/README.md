# Rôles et droits Grist — Pilotage studio (V2)

Documentation **métier / ACL** du document Grist `nei9DeARs5Eo` (Pilotage studio V2). Complète [`SECURITY.md`](../../../SECURITY.md) et l’état des lieux rôles.

**Statut** : inventaire **anonymisé** + matrice brouillon + colonne `Equipe.Role` préparée. Access Rules par rôle **à valider HITL** avant application large. UX widget selon rôle **différée**.

> **Repo public** — ne jamais committer de listes nominatives (noms, emails, inventaires `/access`). Utiliser le MCP en local ; ne garder dans `docs/` que des agrégats.

## Couches

| Couche | Où | Rôle |
|--------|-----|------|
| Partage document | Grist → Partager | OWNER / EDITOR / VIEWER (porte d’entrée) |
| Access Rules + User Attributes | Grist → Règles d’accès | Fine-grained R/U/C/D/S + matching email → `Equipe` |
| Custom Widget | iframe | UX seulement — **ne remplace pas** les ACL |

## Documents de ce module

| Fichier | Contenu |
|---------|---------|
| [inventaire-partage.md](inventaire-partage.md) | Synthèse anonymisée (versionnée) |
| `docs/fonctionnel/roles/private/` *(gitignoré, hors git)* | Inventaire nominatif local — `rm -rf` en fin de chantier |
| [matrice-droits.md](matrice-droits.md) | Brouillon tables × 4 rôles (à valider) |
| [prep-equipe.md](prep-equipe.md) | Colonne `Role` + backlog emails |
| [access-rules.md](access-rules.md) | ACL actuelles + procédure User Attributes / View As |
| [widget-ux.md](widget-ux.md) | Différé : adaptation UX widget |

## Rôles cibles (`Equipe.Role`)

| Valeur Choice | Intention |
|---------------|-----------|
| Admin | Pilotage complet + tables budgétaires |
| Responsable de département | Périmètre de son `Equipe` (département) |
| Freelance | Périmètre limité (ses lignes / missions) |
| Invité | Lecture très restreinte |

Colonne créée sur `Equipe` : `Role` (label « Rôle ACL »). Remplir manuellement après validation de la matrice.

## Prérequis matching email

User Attribute prévu : `user.Email` → `Equipe.E_mail` → attribut `user.Equipe` (puis `user.Equipe.Role`, `user.Equipe.Equipe`).

Sans email renseigné dans `Equipe`, pas de match ACL → deny ou fallback selon les rules.

## Hors scope (V1 widget)

- Masquer des écrans widget **à la place** des ACL
- Écriture programmatique des Access Rules via API (risque lock-out)
- Remplir automatiquement tous les emails manquants (données RH / Owner)
