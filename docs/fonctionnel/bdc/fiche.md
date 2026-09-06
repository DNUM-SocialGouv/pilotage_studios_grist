# Fiche bon de commande — `/bdc/:id`

[← Bons de commande](README.md) › **Fiche**

## Objet

Détail d’un BDC : synthèse financière, informations, lien vers le PA et reste à consommer du PA.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/bdc/:id` |
| Page | `src/pages/BdcDetailView.tsx` |
| Retour | Lien vers `/bdc` |

## États

| État | UI |
|------|-----|
| Embed non autorisé | Alerte erreur + retour liste |
| Hors Grist | Alerte info + retour liste |
| Chargement connexion | « Connexion à Grist… » |
| Erreur | Alerte erreur + retour liste |
| Accès multi-tables denied / error | Alerte warning (full requis) |
| Chargement BDC | « Chargement du bon de commande… » |
| BDC introuvable | Alerte warning |
| OK | Synthèse + informations |

## Contenu

- Statut (sous-titre) + titre (`Nom_BdC` ou `BDC #id`)
- Synthèse : budget TTC, consommé CRA, solde CRA
- Informations : financeur, Chorus, **plan d’activité** (lien `/pa/:id` + reste à consommer si calculable), plateforme, engagement, équipe (badges couleur — même mapping que la liste)

## Liens croisés

Vers [`/pa/:id`](../pa/fiche.md) quand `BDC.PA` est renseigné.
