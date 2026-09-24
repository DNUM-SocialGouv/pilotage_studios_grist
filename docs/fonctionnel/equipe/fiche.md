# Fiche personne — `/equipe/:id`

[← Équipe](README.md) › **Fiche**

## Objet

Voir la carte d’identité d’une personne — mise en page alignée sur la fiche mission (badges + bandeau). Les **Admin** peuvent **modifier** la fiche via le même panneau que la création.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe/:id` |
| Page | `src/pages/EquipeDetailView.tsx` (sous `EquipeLayout`) |
| Retour | Fil d’Ariane : Accueil › Équipe › nom de la personne |
| Édition | Bouton **Modifier** (Admin / preview standalone) → drawer `EquipeFormDrawer` (`openEdit`) |
| Issues | [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX) · [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) / [#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61) (TJM / Total TTC) · [#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62) (missions) · [#63](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63) (édition Admin) |

## Édition (Admin)

Mêmes champs que la création : Prénom Nom *, E-mail *, Département, Spécialité, Statut, Portage, Ordinateur, Mode de recrutement, Rôle *, TJM.

- Après enregistrement : rechargement de la liste / fiche (on reste sur `/equipe/:id`).
- **Rôle** : obligatoire à l’édition (évite d’effacer les droits par accident). Une valeur hors liste standard reste proposée dans le sélecteur.
- TJM : laisser le champ vide **conserve** la valeur actuelle (ne l’efface pas).
- L’e-mail n’apparaît **jamais** en consultation ; seulement dans le drawer.
- Les freelances (et autres non-Admin) ne voient pas le bouton. Sécurité réelle = Access Rules Grist (Owner / Admin seuls peuvent mettre à jour).

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Personne introuvable » + retour liste |
| OK | En-tête (badges + nom + bouton Modifier si Admin) · bandeau · section Missions & prestations |

## Affichage

| Zone | Contenu |
|------|---------|
| Avatar | Image Glyphs (seed `Avatar`) à gauche du titre |
| Badges | Statut (couleurs Actif / Inactif), rôle, portage — seulement s’ils sont lisibles |
| Titre | Nom (`Prenom_Nom`) |
| Action | Bouton **Modifier** (Admin) |
| Bandeau | Département (toujours, tag couleur studio) · spécialité si lisible · **TJM** et **Total TTC** si lisibles |
| Section | **Missions & prestations** ([#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62)) : tableau des prestations où la personne est **Intervenant**, lien vers `/missions/:id`, filtre En cours / Toutes |

### Missions & prestations

- Source : tables `Missions` + `Missions_enfants` (chargement lazy sur la fiche uniquement).
- Colonnes : **Mission** (lien, regroupée si plusieurs prestations) · **Prestation** · **Statut**.
- Une ligne = une **prestation** staffée ; les prestations d’une même mission sont regroupées (mission affichée une seule fois).
- Filtre **En cours** : exclut Terminé / Clos / Archivé / Annulé (et variantes) ; conserve En cours, En pause, En projet, etc.
- Filtre **Toutes** : historique inclus.
- Pas de création / édition de mission depuis Équipe. Pas d’aperçu CRA sur cette page.
- On n’affiche que ce que Grist laisse déjà lire (mêmes droits qu’ailleurs).

### TJM et Total TTC

Le widget **n’invente pas** les droits : il affiche ces montants seulement quand Grist les livre (nombre lisible).

| Qui regarde | TJM / Total TTC |
|-------------|-----------------|
| Owner / Admin | Toutes les fiches |
| Freelance sur **sa** fiche | Oui (e-mail compte = `Equipe.E_mail`) |
| Freelance sur une **autre** fiche | Non (masqué) |

Règle Grist **appliquée** : voir [access-rules.md](../roles/access-rules.md).

Pas de bouton supprimer. Pas d’e-mail affiché en consultation (saisie e-mail uniquement dans le drawer Admin, voir [liste.md](liste.md)). Pas de TJM / Total TTC sur la **liste**.
