# Fiche personne — `/equipe/:id`

[← Équipe](README.md) › **Fiche**

## Objet

Voir la carte d’identité d’une personne, en lecture seule.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe/:id` |
| Page | `src/pages/EquipeDetailView.tsx` |
| Retour | Lien vers `/equipe` |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Personne introuvable » + retour liste |
| OK | Titre = nom ; champs ci-dessous |

## Champs

Département, portage, statut, spécialité, rôle, missions en cours.

Pas de bouton créer / éditer. Pas de TJM, montant ni e-mail.
