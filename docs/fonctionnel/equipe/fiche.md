# Fiche personne — `/equipe/:id`

[← Équipe](README.md) › **Fiche**

## Objet

Voir la carte d’identité d’une personne, en lecture seule — mise en page alignée sur la fiche mission (badges + bandeau).

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe/:id` |
| Page | `src/pages/EquipeDetailView.tsx` (sous `EquipeLayout`) |
| Retour | Lien vers `/equipe` |
| Issues | [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX) · [#60](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60) / [#61](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61) (TJM / Total TTC) |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Personne introuvable » + retour liste |
| OK | En-tête (badges + nom) · bandeau · missions texte si présent |

## Affichage

| Zone | Contenu |
|------|---------|
| Badges | Statut (couleurs Actif / Inactif), rôle, portage — seulement s’ils sont lisibles |
| Titre | Nom (`Prenom_Nom`) |
| Bandeau | Département (toujours, tag couleur studio) · spécialité si lisible · **TJM** et **Total TTC** si lisibles |
| Section | « Missions en cours » en texte brut si la colonne est lisible (pas de liens — [#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62)) |

### TJM et Total TTC

Le widget **n’invente pas** les droits : il affiche ces montants seulement quand Grist les livre (nombre lisible). Cible métier :

| Qui regarde | TJM / Total TTC |
|-------------|-----------------|
| Owner / Admin | Toutes les fiches |
| Freelance sur **sa** fiche | Oui |
| Freelance sur une **autre** fiche | Non (masqué) |

Règle Grist à appliquer par un **Owner** (UI Access Rules) : voir [access-rules.md](../roles/access-rules.md) § TJM / Total TTC. Tant que l’ancienne règle « non-Owner → refus » reste en place, seuls les Owners document voient ces champs.

Mention « Consultation uniquement ». Pas de bouton créer / éditer. Pas d’e-mail dans le widget. Pas de TJM / Total TTC sur la **liste**.
