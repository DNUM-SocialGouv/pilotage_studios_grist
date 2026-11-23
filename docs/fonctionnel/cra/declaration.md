# Mon carnet (déclarer le CRA)

[← CRA](README.md) › **Mon carnet**

> **Route** : `/cra/declarer` (saisie Freelance)  
> **Entrée** : menu compte → **Mon carnet**.  
> Admin / Responsable de département : même entrée menu → redirection vers [Revue CRA équipe](revue-equipe.md) (`/cra/revue-equipe`).

## En clair

**Mon carnet** est l’endroit où un **freelance** saisit ses jours du mois (prestations en cours, description), puis enregistre. Les **Admin** et **Responsables de département** n’ont plus une « autre version » de cette page : en cliquant **Mon carnet**, ils ouvrent directement la **revue CRA équipe** (jours, descriptions, rattachement BdC du département).

La page **Missions** reste ouverte pour tout le monde (contexte, documents).

Le haut de page (saisie) montre l’identité (avatar, nom, **tag équipe** coloré) et un **cadre** TJM (si lisible), prestations en cours, jours saisis, Total HT.

## Qui y accède

| Rôle | Accès | Contenu |
|------|--------|---------|
| Freelance | Oui (menu compte + garde) | Saisie CRA (prestations « moi ») sur `/cra/declarer` |
| Admin | Oui (menu compte) | Redirigé vers `/cra/revue-equipe` |
| Responsable de département | Oui (menu compte) | Redirigé vers `/cra/revue-equipe` |
| Invité | Non (redirection accueil) | — |

Pas de drapeau `Page_*` dédié : l’accès repose sur `Acl_profil.Role`.

## Parcours freelance

1. Choisir le **mois** du carnet.
2. Onglet **En cours** : pour chaque **mission**, renseigner les **jours** et une **description** par prestation.
3. **Publier le carnet** → crée ou met à jour les lignes `Realise` du mois.

Si une saisie existe déjà pour le mois / la prestation, le formulaire la préremplit. Sous le titre de la prestation, le carnet affiche alors en **lecture seule** « Bon de commande : » suivi uniquement du **numéro** (n° Chorus) — jamais du nom. « Sans BDC » s’il n’y a pas encore de rattachement ; « Sans numéro » si le bon est lié mais sans Chorus. Le rattachement lui-même se fait toujours via **Revue CRA équipe**, pas depuis la saisie.

Le **Total HT** du cadre est un calcul d’affichage (jours saisis × TJM) : il n’écrit pas `Calcul_TTC` dans Grist.

## Parcours Admin / Responsable

Voir [revue-equipe.md](revue-equipe.md) — entrée **Mon carnet** (menu compte). Plus de liste département séparée sur `/cra/declarer`.

## Données

| Table | Usage |
|-------|--------|
| `Equipe` | Identifier « moi » (e-mail session = `Equipe.E_mail`) + libellé département |
| `Missions` / `Prestations` | Prestations où `Intervenant` = moi |
| `Realise` | Create / update : `Nb_jours`, `Taches_realisees`, `Periode`, `Intervenants`, `Prestation` — **pas** `Equipe` ni `Mission` (formules Grist) ni `Calcul_TTC` ni lien BDC |

Pas d’écriture de `Calcul_TTC` ni de lien BDC (qualification = revue équipe).

## Prérequis

1. Fiche `Equipe` avec `E_mail` **identique** au compte Grist.
2. **HITL Owner** : règle `Equipe.E_mail` **comme le TJM** — condition  
   `user.Access != "OWNER" and user.Equipe.Role_ACL != "Admin" and user.Email != rec.E_mail` → `-RU`  
   (supprimer l’ancien deny « non-Owner/Admin » sans exception soi, et inutile d’ajouter un `+R` soi à part : le refus l’emporterait). Voir [access-rules.md](../roles/access-rules.md).
3. Staffing : prestations avec `Intervenant` = la personne.

Identité widget : l’e-mail de session vient de **`Acl_profil.E_mail`** (pas du jeton REST, souvent sans e-mail).

## Limites V1

- Pas de soumission / relecture manager depuis la saisie (→ revue équipe).
- Pas de suppression de ligne CRA depuis le widget.
- Admin / Resp. ne déclarent plus leurs propres jours via cette page (saisie = rôle Freelance).

## Liens

- [Revue équipe](revue-equipe.md)
- [Liste CRA](liste.md)
- [CRA README](README.md)
