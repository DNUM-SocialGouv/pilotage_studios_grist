# Fiche bon de commande — `/bdc/:id`

[← Bons de commande](README.md) › **Fiche**

## Objet

Détail d’un BDC : récap financier (KPI + barre), informations, lien vers le PA.

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
| OK | Récap + informations |

## Récap financier

Sous le titre, pattern aligné sur l’app sœur (`BdcFinanceRecap`, PR pilotage_studios #198) :

| Bloc | Source |
|------|--------|
| Budget TTC | `Montant_TTC` |
| Total consommé (CRA) | `Total_TTC_CRA` |
| Solde CRA | `Solde_TTC_CRA` (rouge si négatif) |

Barre « % consommé » vs budget (`Total_TTC_CRA / Montant_TTC`) ; segment plafonné à 100 % en cas de dépassement.

## Informations

Grille définition (labels au-dessus des valeurs, 4 colonnes ≥ lg / 2 ≥ sm) :

| Champ | Source |
|-------|--------|
| Financeur | `Financeur` |
| Chorus | `BdC_Chorus` |
| Plan d’activité | `PA` → lien `/pa/:id` |
| Plateforme | `Plateforme` |
| Engagement | `Engagement` |
| Équipe | `Equipe2` (badges couleur) |
| Reste à consommer du PA | calculé si PA lié |

Hors scope widget (présents dans l’app sœur) : Sofiane, devis (attachments), onglets suivi CRA / PV.

## Liens croisés

Vers [`/pa/:id`](../pa/fiche.md) quand `BDC.PA` est renseigné.
