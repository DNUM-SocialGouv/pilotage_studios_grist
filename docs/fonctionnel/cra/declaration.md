# Déclarer mon CRA

[← CRA](README.md) › **Déclaration**

> **Route** : `/cra/declarer`  
> **Nav** : Budget → Déclarer mon CRA (Freelance et Admin)

## En clair

En fin de mois, le freelance ouvre **Déclarer mon CRA**, choisit le mois, et ne voit **que ses prestations en cours** (groupées par mission). Pour chacune : nombre de jours + description courte, puis enregistrement. La page **Missions** reste ouverte pour tout le monde (contexte, documents) — ce n’est pas un filtre sur le catalogue.

Le haut de page montre l’identité (avatar, nom, **tag équipe** coloré) et le mois. Dans l’onglet **En cours**, un **cadre** reprend le modèle de la fiche Équipe : TJM (si lisible), nombre de prestations en cours, jours saisis du mois, et **Total HT** indicatif (= jours × TJM). L’onglet **Passées** est prévu ensuite (sans ce cadre, qui n’a de sens que pour la saisie du mois).

## Qui y accède

| Rôle | Accès |
|------|--------|
| Freelance | Oui (nav + garde de rôle) |
| Admin | Oui (pour tester / dépanner) |
| Autres | Non (redirection accueil) |

Pas de drapeau `Page_*` dédié : l’accès repose sur `Acl_profil.Role` (Freelance ou Admin).

## Parcours

1. Choisir le **mois** du carnet.
2. Onglet **En cours** : pour chaque **mission**, renseigner les **jours** et une **description** par prestation.
3. **Publier le carnet** → crée ou met à jour les lignes `Realise` du mois.

Si une saisie existe déjà pour le mois / la prestation, le formulaire la préremplit.

Le **Total HT** du cadre est un calcul d’affichage (jours saisis × TJM) : il n’écrit pas `Calcul_TTC` dans Grist.

## Données

| Table | Usage |
|-------|--------|
| `Equipe` | Identifier « moi » (e-mail session = `Equipe.E_mail`) + libellé département |
| `Missions` / `Missions_enfants` | Prestations où `Intervenant` = moi et statut « en cours » |
| `Realise` | Create / update : `Nb_jours`, `Taches_realisees`, `Periode`, `Intervenants`, `Mission_enfant`, `Missions`, `Equipe` |

Pas d’écriture de `Calcul_TTC` ni de lien BDC (qualification = [#34](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34)).

## Prérequis

1. Fiche `Equipe` avec `E_mail` **identique** au compte Grist.
2. **HITL Owner** : règle `Equipe.E_mail` **comme le TJM** — condition  
   `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` → `-RU`  
   (supprimer l’ancien deny « non-Owner/Admin » sans exception soi, et inutile d’ajouter un `+R` soi à part : le refus l’emporterait). Voir [access-rules.md](../roles/access-rules.md).
3. Staffing : prestations avec `Intervenant` = la personne.

Identité widget : l’e-mail de session vient de **`Acl_profil.E_mail`** (pas du jeton REST, souvent sans e-mail).

## Limites V1

- Pas de soumission / relecture manager (suite [#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33)).
- Pas encore d’Access Rules sur `Realise` (filtre UX seulement — mur données = [#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47), session suivante).
- Pas de suppression de ligne CRA depuis le widget.

## Liens

- Liste Admin : [liste.md](liste.md) (`/cra`)
- Issue : [#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33)
