# Équipe

[← Documentation](../../README.md) › **Équipe**

> **Routes** : `/equipe`, `/equipe/:id`  
> **Issues** : [#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53) (écran) · [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55) (Access Rules)

## Objet métier

L’**équipe** rassemble les personnes du pilotage (table Grist `Equipe`). Le widget affiche un **annuaire** en consultation. Pas d’édition, pas de TJM.

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

Colonnes widget (Admin / droits complets) : `Prenom_Nom`, `Equipe`, `Portage`, `Statut`, `Specialite`, `Role_ACL`, `Missions_en_cours` (fiche).

**Jamais** dans le widget : `TJM`, `Total_TTC`, `E_mail` (et champs budgétaires).

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
- Qui voit le menu : [Droits des pages](../roles/droits-pages-admin.md) (#54)
- Règles sur `Realise` / page freelance missions (#47)
