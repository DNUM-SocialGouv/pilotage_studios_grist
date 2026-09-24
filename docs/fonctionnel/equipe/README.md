# Équipe

[← Documentation](../../README.md) › **Équipe**

> **Routes** : `/equipe`, `/equipe/:id`  
> **Issues** : [#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53) (écran) · [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX fiche) · [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) (Access Rules) · création Admin (carte kanban `equipe-fiche-creation-admin`) · édition [#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63) (hors scope)

## Objet métier

L’**équipe** rassemble les personnes du pilotage (table Grist `Equipe`). Le widget affiche un **annuaire** : consultation pour tous les rôles autorisés à la page, et **création** d’une fiche réservée aux **Admin**. Les montants (**TJM**, **Total TTC**) n’apparaissent que sur la **fiche**, et seulement s’ils sont lisibles (Admin / Owner, ou la personne elle-même) — sauf à la **création** Admin, où le TJM peut être saisi.

Selon les **Access Rules** Grist, un **Freelance** ne voit que **nom**, **département** et **spécialité** (autres colonnes masquées côté Grist et dans le widget).

| Outil | Rôle |
|-------|------|
| **Grist** (`Equipe`) | Référentiel + rôle ACL + règles d’accès |
| **Ce widget** | Liste / fiche lecture ; création Admin (drawer) ; colonnes/filtres adaptés si champs censurés |
| **App sœur** | Hors scope |

## Données Grist

| Table | Usage |
|-------|--------|
| `Equipe` | Liste et fiche (`fetchAllowlistedTable`) ; **create** Admin via drawer |
| `Missions`, `Missions_enfants` | Fiche uniquement : section Missions & prestations (Intervenant → personne) |

Colonnes widget (Admin / droits complets) : `Prenom_Nom`, `Equipe`, `Portage`, `Statut`, `Specialite`, `Role_ACL`, `Avatar` (seed image Glyphs), `TJM` / `Total_TTC` (fiche, si Access Rules).

**Consultation** : **jamais** d’`E_mail` affiché sur liste / fiche. **Création Admin** : l’e-mail est saisi dans le drawer (nécessaire pour relier le compte Grist au rôle). **Jamais** de TJM / Total TTC sur la liste. Pas d’édition `Avatar` dans le widget (changement du seed = Grist UI). Pas d’**update** fiche depuis le widget (voir #63).

Allowlist lecture : `src/security/fetchTableAllowlist.ts`. Allowlist écriture : `Equipe` **create only** (`writeTableAllowlist.ts`).

Détail ACL : [access-rules.md](../roles/access-rules.md).

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste (+ création Admin) | [liste.md](liste.md) | `/equipe` |
| Fiche | [fiche.md](fiche.md) | `/equipe/:id` |

Le drapeau de page Grist est `Page_equipe` ([Droits des pages](../roles/droits-pages-admin.md)).

## Hors scope (widget)

- Modification d’une fiche existante (#63)
- Suppression d’une personne
- Création / édition de mission depuis la fiche personne
- Aperçu CRA sur la fiche personne
- Qui voit le menu : [Droits des pages](../roles/droits-pages-admin.md) (#54)
- Règles sur `Realise` / page freelance missions (#47)
