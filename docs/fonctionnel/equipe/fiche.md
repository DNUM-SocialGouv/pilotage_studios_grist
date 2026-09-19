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
| Issue | [#59](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59) (UX) |

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
| Bandeau | Département (toujours, tag couleur studio) · spécialité si lisible |
| Section | « Missions en cours » en texte brut si la colonne est lisible (pas de liens — [#62](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62)) |

Mention « Consultation uniquement ». Pas de bouton créer / éditer. Pas de TJM, montant ni e-mail.
