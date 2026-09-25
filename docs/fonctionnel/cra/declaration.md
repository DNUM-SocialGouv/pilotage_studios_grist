# Mon carnet (déclarer le CRA)

[← CRA](README.md) › **Mon carnet**

> **Route** : `/cra/declarer`  
> **Nav** : **Mon carnet** (niveau 1 — Freelance, Admin, Responsable de département). Pas sous Budget.

## En clair

Selon le rôle, **Mon carnet** sert deux intentions :

- **Freelance** : en fin de mois, choisir le mois, voir **ses prestations en cours** (groupées par mission), saisir jours + description, puis enregistrer.
- **Admin** et **Responsable de département** : **liste en lecture** des missions qui ont **au moins une prestation** dont l’intervenant est dans **leur** département (ex. Product). Une mission mixte (Access. + Design + Product) apparaît ; une mission uniquement Access. n’apparaît pas pour un Admin Product. Pas de saisie de jours ici — la revue CRA (jours / BDC) reste sous Budget → Revue CRA équipe.

La page **Missions** reste ouverte pour tout le monde (contexte, documents).

Le haut de page montre l’identité (avatar, nom, **tag équipe** coloré). En mode freelance, un **cadre** reprend TJM (si lisible), prestations en cours, jours saisis, Total HT. En mode manager : nombre de missions / prestations du périmètre.

## Qui y accède

| Rôle | Accès | Contenu |
|------|--------|---------|
| Freelance | Oui (nav + garde) | Saisie CRA (prestations « moi ») |
| Admin | Oui | Liste lecture missions du **département** (`Equipe.Equipe`) |
| Responsable de département | Oui | Idem Admin (même filtre département) |
| Invité | Non (redirection accueil) | — |

Pas de drapeau `Page_*` dédié : l’accès repose sur `Acl_profil.Role`.

**Prérequis manager** : `Equipe.Equipe` renseigné sur la fiche — sinon message « pas de département » (comme la revue équipe).

## Parcours freelance

1. Choisir le **mois** du carnet.
2. Onglet **En cours** : pour chaque **mission**, renseigner les **jours** et une **description** par prestation.
3. **Publier le carnet** → crée ou met à jour les lignes `Realise` du mois.

Si une saisie existe déjà pour le mois / la prestation, le formulaire la préremplit.

Le **Total HT** du cadre est un calcul d’affichage (jours saisis × TJM) : il n’écrit pas `Calcul_TTC` dans Grist.

## Parcours Admin / Responsable

1. Ouvrir **Mon carnet** (nav niveau 1).
2. Onglet **En cours** : missions avec prestations actives du département ; lien vers la fiche mission ; **tableau** par mission (prestation, intervenant, statut, nb CRA, TTC engagé).
3. Onglet **Passées** : prestations terminées du même périmètre.
4. Bandeau : Missions · Prestations · Lignes CRA · TTC engagé (le département reste dans le hero / badge).

Pas de mois, pas de « Publier ». Pour ajuster les CRA des freelances : **Budget → Revue CRA équipe**.

**Indicateurs** : nb CRA = lignes `Realise` liées à la prestation ; TTC engagé = somme des montants TTC de ces lignes (même logique que la liste Missions).

## Données

| Table | Usage |
|-------|--------|
| `Equipe` | Identifier « moi » (e-mail session = `Equipe.E_mail`) + libellé département ; map intervenant → département (manager) |
| `Missions` / `Missions_enfants` | Freelance : prestations où `Intervenant` = moi ; manager : prestations dont l’intervenant a le même `Equipe.Equipe` |
| `Realise` | Freelance only — create / update : `Nb_jours`, `Taches_realisees`, `Periode`, `Intervenants`, `Mission_enfant`, `Missions`, `Equipe` |

Pas d’écriture de `Calcul_TTC` ni de lien BDC (qualification = [#34](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34)).

## Prérequis

1. Fiche `Equipe` avec `E_mail` **identique** au compte Grist.
2. **HITL Owner** : règle `Equipe.E_mail` **comme le TJM** — condition  
   `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` → `-RU`  
   (supprimer l’ancien deny « non-Owner/Admin » sans exception soi, et inutile d’ajouter un `+R` soi à part : le refus l’emporterait). Voir [access-rules.md](../roles/access-rules.md).
3. Staffing : prestations avec `Intervenant` = la personne (freelance) ou département renseigné (manager).

Identité widget : l’e-mail de session vient de **`Acl_profil.E_mail`** (pas du jeton REST, souvent sans e-mail).

## Limites V1

- Pas de soumission / relecture manager depuis Mon carnet (→ revue équipe [#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70)).
- Filtre département manager = **confort UX** ; Access Rules `Missions` encore ouvertes (couche 6 plus tard).
- Pas de suppression de ligne CRA depuis le widget.
- Admin / Resp. ne déclarent plus leurs propres jours via cette page (saisie = rôle Freelance).

## Liens

- Liste Admin : [liste.md](liste.md) (`/cra`)
- Revue équipe : [revue-equipe.md](revue-equipe.md)
- Matrice rôles : [matrice-droits.md](../roles/matrice-droits.md)
- Issue : [#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33)
