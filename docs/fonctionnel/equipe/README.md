# Équipe

[← Documentation](../../README.md) › **Équipe**

> **Routes** : `/equipe`, `/equipe/:id`  
> **Issues** : [#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53) (écran) · [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX fiche) · [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) (Access Rules)

## Objet métier

L’**équipe** rassemble les personnes du pilotage (table Grist `Equipe`). Le widget affiche un **annuaire** en consultation. Pas d’édition. Les montants (**TJM**, **Total TTC**) n’apparaissent que sur la **fiche**, et seulement s’ils sont lisibles (Admin / Owner, ou la personne elle-même).

Selon les **Access Rules** Grist, un **Freelance** ne voit que **nom**, **département** et **spécialité** (autres colonnes masquées côté Grist et dans le widget).

| Outil | Rôle |
|-------|------|
| **Grist** (`Equipe`) | Référentiel + rôle ACL + règles d’accès |
| **Ce widget** | Liste / fiche lecture (`EquipeLayout`) ; colonnes/filtres adaptés si champs censurés |
| **App sœur** | Hors scope |

## Données Grist

| Table | Usage |
|-------|--------|
| `Equipe` | Liste et fiche (`fetchAllowlistedTable`) |
| `Missions`, `Missions_enfants` | Fiche uniquement : section Missions & prestations (Intervenant → personne) |

Colonnes widget (Admin / droits complets) : `Prenom_Nom`, `Equipe`, `Portage`, `Statut`, `Specialite`, `Role_ACL`, `Avatar` (seed image Pixelbot), `TJM` / `Total_TTC` (fiche, si Access Rules).

**Jamais** dans le widget : `E_mail` (et autres champs budgétaires hors TJM / Total TTC autorisés). **Jamais** de TJM / Total TTC sur la liste. Pas d’édition `Avatar` dans le widget (changement du seed = Grist UI).

Allowlist lecture : `src/security/fetchTableAllowlist.ts`. Pas d’écriture `Equipe`.

Détail ACL : [access-rules.md](../roles/access-rules.md).

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/equipe` |
| Fiche | [fiche.md](fiche.md) | `/equipe/:id` |

Le drapeau de page Grist est `Page_equipe` ([Droits des pages](../roles/droits-pages-admin.md)).

## Hors scope (widget)

- Création / modification d’une fiche
- Création / édition de mission depuis la fiche personne
- Aperçu CRA sur la fiche personne (hors scope #62)
- Qui voit le menu : [Droits des pages](../roles/droits-pages-admin.md) (#54)
- Règles sur `Realise` / page freelance missions (#47)
