# Revue CRA équipe

[← CRA](README.md) › **Revue équipe**

> **Route** : `/cra/revue-equipe`  
> **Entrée** : menu compte → **Mon carnet** (Admin ou Responsable de département) — plus dans Budget  
> **Issue** : [#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70) (suite qualification [#34](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34))

## En clair

En fin de mois, le **manager d’un département** (Design, Product, Tech…) ouvre **Mon carnet**, choisit le mois, passe en revue les freelances **actifs** de **son** département, peut ajuster jours et description, et surtout **rattache chaque ligne au bon de commande**. Pas d’étape « valider / rejeter » : on enregistre les modifications comme dans Grist, avec un parcours lisible.

## Qui y accède

| Condition | Accès |
|-----------|--------|
| `Role_ACL` = Admin **ou** Responsable de département | Menu compte **Mon carnet** + garde de rôle |
| **et** `Equipe.Equipe` (département) renseigné sur sa fiche | Sinon message « pas de département » (cas admin transverse) |
| Freelance / Invité | Non (Freelance : saisie sur `/cra/declarer`) |

Pas de drapeau `Page_*` dédié : accès par rôle (comme la déclaration).

**Périmètre** : collègues **actifs** (`Equipe.Statut` = Actif, ou vide = Actif par défaut) dont `Equipe.Equipe` = même valeur que le manager (hors soi). Les fiches **Inactif** (et autres statuts) n’apparaissent pas dans les accordéons ni dans les indicateurs d’équipe.

## Parcours

1. Choisir le **mois**.
2. Lire les KPI d’équipe (freelances avec saisie, jours, CRA sans BDC, HT indicatif).
3. Deux groupes d’**accordéons** : **Avec saisie ce mois** puis **Sans saisie ce mois** (un seul accordéon ouvert à la fois). Pour chaque ligne CRA — jours, description, **bon de commande**. Le libellé fermé montre le nombre de lignes, le TJM s’il est connu, et un badge si des CRA sont sans BDC.
4. **Enregistrer les rattachements** → update `Realise` (`Nb_jours`, `Taches_realisees`, `BDC_cible`).

Si le freelance n’a pas encore saisi : message d’info (la déclaration reste sur `/cra/declarer`).

## Données

| Table | Usage |
|-------|--------|
| `Equipe` | Identité manager + liste du département (+ TJM si lisible pour HT) |
| `Realise` | Lignes du mois / intervenant ; update jours, description, BDC |
| `Missions` / `Prestations` | Libellés |
| `BDC` | Options du sélecteur (déjà en contexte PA) |

## Limites V1

- Pas de workflow soumis / validé / rejeté.
- Filtre département = **confort UX** ; mur Access Rules `Realise` = **fait** ([#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47) / [#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70)).
- Pas de création de ligne CRA depuis cette page.
- Tous les managers d’un même département voient les mêmes CRA.

## Liens

- Déclaration freelance : [declaration.md](declaration.md)
- Liste Admin : [liste.md](liste.md)
- Matrice rôles : [matrice-droits.md](../roles/matrice-droits.md)
