# Fiche personne — `/equipe/:id`

[← Équipe](README.md) › **Fiche**

## Objet

Voir la carte d’identité d’une personne, en lecture seule.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/equipe/:id` |
| Page | `src/pages/EquipeDetailView.tsx` (sous `EquipeLayout`) |
| Retour | Lien vers `/equipe` |

## États

| État | UI |
|------|-----|
| Chargement | Alerte « Connexion à Grist… » |
| Erreur Grist | Alerte erreur |
| Id inconnu | Alerte « Personne introuvable » + retour liste |
| OK | Titre = nom ; champs ci-dessous |

## Champs

Toujours : département.  
Autres (portage, statut, spécialité, rôle, missions en cours) : affichés seulement s’ils sont lisibles (Access Rules).

Pas de bouton créer / éditer. Pas de TJM, montant ni e-mail.
