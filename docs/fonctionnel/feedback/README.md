# Feedback utilisateur (widget flottant)

Bouton fixe « Un retour ? » (bas droite) présent sur **tous** les écrans du Custom Widget. Ouvre un panneau pour signaler une anomalie, une suggestion ou une question. Chaque envoi crée une ligne dans la table Grist `Retours`.

Référence design : [`design/feedback_widget/`](../../../design/feedback_widget/).

## Comportement

| Élément | Détail |
|---------|--------|
| Montage | [`WidgetLayout`](../../../src/layout/WidgetLayout.tsx) — pas une route dédiée |
| Types | Anomalie / Suggestion / Question (segmentés) |
| Page concernée | Select prérempli depuis la route MemoryRouter |
| Message | Obligatoire ; bouton d’envoi désactivé si vide |
| Niveau de gêne | Visible seulement si type = Anomalie |
| Identité | Select searchable (liste déroulante riche) sur la table `Equipe` (`Prenom_Nom` / `E_mail`) — obligatoire |
| Contexte technique | Case cochée par défaut (URL widget · UA · résolution) |
| Après envoi | Confirmation ; *Fermer* / *Un autre retour* |
| Erreur | Message + possibilité de réessayer (panneau reste ouvert) |

## Identité

Pas d’auto-détection Grist (le jeton widget ne fournit pas un profil fiable). L’utilisateur choisit sa ligne dans `Equipe` (chargée via `fetchAllowlistedTable('Equipe')` à l’ouverture du panneau). `Auteur` / `Email` sont écrits depuis ce choix.

**Limite V1** : choix **déclaratif** (pas de lien session Grist ↔ ligne Equipe) — un utilisateur peut sélectionner un autre nom. Acceptable pour un canal de feedback interne ; durcissement possible plus tard (ACL / matching email).

## Table Grist `Retours`

| Colonne | Remplie à l’envoi |
|---------|-------------------|
| `Date`, `Auteur`, `Email`, `Type`, `Page`, `Message`, `Niveau_gene`, `Contexte_technique`, `Statut` (= Nouveau) | Oui |
| `Priorite`, `Assigne_a`, `Lien_ticket`, `Reponse` | Non (suivi équipe dans Grist) |

Écriture widget : **create uniquement** via `grist.getTable('Retours').create`, gardée par [`writeTableAllowlist.ts`](../../../src/security/writeTableAllowlist.ts). Pas de lecture liste retours dans le widget V1 (`Retours` **hors** `FETCH_TABLE_ALLOWLIST`).

## Access Rules (HITL — à appliquer dans Grist)

Recommandation (à valider / poser manuellement) :

- **Create** : utilisateurs ayant accès au document (même population que le widget).
- **Update / Delete** : Owners / équipe studio uniquement (tri `Statut`, `Priorite`, `Assigne_a`, `Reponse`).
- Choices Type / Niveau_gene / Statut / Priorite : à peaufiner dans l’UI Grist si besoin (colonnes créées en Text + valeurs métier documentées).

Sans ces règles, tout utilisateur *Editor* du doc peut aussi modifier les retours des autres.

## Hors scope V1

- Vue Kanban / page widget listant les retours
- Notifications Tchap / mail / webhook
- Boucle auto « informé·e » (champ `Reponse` + statut Fait/Écarté) — promise UX documentée, pas d’automation
