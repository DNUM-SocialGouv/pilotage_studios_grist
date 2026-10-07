# Fiche personne — `/equipe/:id`

[← Équipe](README.md) › **Fiche**

## Objet

Voir la carte d’identité d’une personne — en-tête P2 (badges + bandeau méta), distinct du hero CallOut des fiches mission / produit. Les **Admin** peuvent **modifier** la fiche via le même panneau que la création.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe/:id` |
| Page | `src/pages/EquipeDetailView.tsx` (sous `EquipeLayout`) |
| Retour | Fil d’Ariane : Accueil › Équipe › nom de la personne |
| Édition | Bouton **Modifier** (Admin / preview standalone) → drawer `EquipeFormDrawer` (`openEdit`) |
| Issues | [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX) · [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) / [#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61) (TJM / Total TTC) · [#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62) (missions) · [#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63) (édition Admin) |

## Édition (Admin)

Mêmes champs identité que la création : Prénom Nom *, E-mail *, Département, Spécialité (fiche), Statut, Portage, Ordinateur, Mode de recrutement, Rôle *.

Plus le bloc **Tarifs journaliers** (grille `Equipe_TJM`) : spécialité du tarif · montant · date de début · date de fin optionnelle · commentaire. **Clôture manuelle** — l’Admin renseigne lui-même la fin d’un ancien tarif ; rien n’est fermé automatiquement. Le champ unique `Equipe.TJM` n’est **plus** édité (source = grille seule).

- Après enregistrement : rechargement de la liste / fiche (on reste sur `/equipe/:id`).
- **Rôle** : obligatoire à l’édition (évite d’effacer les droits par accident). Une valeur hors liste standard reste proposée dans le sélecteur.
- L’e-mail n’apparaît **jamais** en consultation ; seulement dans le drawer.
- Les freelances (et autres non-Admin) ne voient pas le bouton. Sécurité réelle = Access Rules Grist (Owner / Admin seuls peuvent mettre à jour la fiche et la grille).

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Personne introuvable » + retour liste |
| OK | En-tête (badges + nom + bouton Modifier si Admin) · bandeau · tarifs (ouverts + historique) · section Missions & prestations |

## Affichage

| Zone | Contenu |
|------|---------|
| Avatar | Image Glyphs (seed `Avatar`) à gauche du titre |
| Badges | Statut (couleurs Actif / Inactif), rôle, portage — seulement s’ils sont lisibles |
| Titre | Nom (`Prenom_Nom`) |
| Action | Bouton **Modifier** (Admin) |
| Bandeau | Département (toujours, tag couleur studio) · spécialité fiche si lisible · **Total TTC** si lisible |
| Tarifs | **Tarifs en vigueur** (liste courte) + **Historique complet** (toutes les lignes grille, y compris closes) — table `Equipe_TJM` ([#86](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/86)) |
| Section | **Missions & prestations** ([#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62)) : tableau des prestations où la personne est **Intervenant**, lien vers `/missions/:id`, filtre En cours / Toutes |

### Missions & prestations

- Source : tables `Missions` + `Missions_enfants` (chargement lazy sur la fiche uniquement).
- Colonnes : **Mission** (lien, regroupée si plusieurs prestations) · **Prestation** · **Statut**.
- Une ligne = une **prestation** staffée ; les prestations d’une même mission sont regroupées (mission affichée une seule fois).
- Filtre **En cours** : exclut Terminé / Clos / Archivé / Annulé (et variantes) ; conserve En cours, En pause, En projet, etc.
- Filtre **Toutes** : historique inclus.
- Pas de création / édition de mission depuis Équipe. Pas d’aperçu CRA sur cette page.
- On n’affiche que ce que Grist laisse déjà lire (mêmes droits qu’ailleurs).

### Tarifs journaliers (`Equipe_TJM`) et Total TTC

**Règle métier** : une grille = personne × spécialité × période.

Le widget affiche la grille seulement quand Grist la livre (ACL table `Equipe_TJM`). Le champ fiche `Equipe.TJM` n’est plus la source d’affichage ni d’édition (legacy ; CRA encore indicatif dessus jusqu’au ticket suivant).

| Qui regarde | Grille tarifs | Total TTC (`Equipe`) |
|-------------|---------------|----------------------|
| Owner / Admin | Toutes les fiches (CRUD grille) | Toutes les fiches |
| Freelance sur **sa** fiche | Lecture seule de ses lignes | Oui (e-mail = `Equipe.E_mail`) |
| Freelance sur une **autre** fiche | Non | Non |

Règles Grist **appliquées** : voir [access-rules.md](../roles/access-rules.md) et [matrice-droits.md](../roles/matrice-droits.md).

Pas de bouton supprimer (ni fiche ni ligne tarif). Pas d’e-mail affiché en consultation (saisie e-mail uniquement dans le drawer Admin, voir [liste.md](liste.md)). Pas de tarifs / Total TTC sur la **liste**.
