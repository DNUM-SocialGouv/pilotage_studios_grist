# Équipe

[← Documentation](../../README.md) › **Équipe**

> **Routes** : `/equipe`, `/equipe/:id`  
> **Issue** : [#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53)

## Objet métier

L’**équipe** rassemble les personnes du pilotage (table Grist `Equipe`). Le widget affiche un **annuaire** en consultation : nom, département, portage, statut, spécialité, rôle. Pas d’édition, pas de TJM ni d’e-mail.

| Outil | Rôle |
|-------|------|
| **Grist** (`Equipe`) | Référentiel personnes + rôle ACL |
| **Ce widget** | Liste / fiche — **lecture seule** |
| **App sœur** | Hors scope de ce livrable |

## Données Grist

| Table | Usage |
|-------|--------|
| `Equipe` | Liste et fiche (`fetchAllowlistedTable`) |

Colonnes affichées : `Prenom_Nom`, `Equipe` (département), `Portage`, `Statut`, `Specialite`, `Role_ACL`, `Missions_en_cours` (fiche).

**Jamais** dans le widget (ticket 1) : `TJM`, `Total_TTC`, `Nb_Jours`, `E_mail`, pièces / BDC.

Allowlist lecture : `src/security/fetchTableAllowlist.ts`. Pas d’écriture `Equipe`.

## Parcours

| Parcours | Fichier | Route |
|----------|---------|-------|
| Liste | [liste.md](liste.md) | `/equipe` |
| Fiche | [fiche.md](fiche.md) | `/equipe/:id` |

Le menu dit **Équipe**. L’ancien chemin `/intervenants` redirige vers `/equipe`. Le drapeau de page Grist reste `Page_intervenants` (pas de renommage dans ce ticket).

## Hors scope (widget)

- Création / modification d’une fiche
- Qui voit le menu (voir [#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54))
- Access Rules Grist sur la table (voir [#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55))
- Missions ou CRA liées depuis la fiche
