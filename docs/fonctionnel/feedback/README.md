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

Écriture widget : **create uniquement** via `grist.getTable('Retours').create`, gardée par [`writeTableAllowlist.ts`](../../../src/security/writeTableAllowlist.ts).

Lecture widget : allowlistée pour la **colonne Feedback** de l’accueil (`fetchAllowlistedTable('Retours')`) — lignes affichées **telles quelles** (pas de filtre « traité » côté front). Colonne **toujours en 1ʳᵉ position** : placeholder d’invitation (CTA) **toujours visible**, puis la liste des tickets s’il y en a.

## Access Rules (HITL — à appliquer dans Grist)

Recommandation (à valider / poser manuellement) :

- **Create** : utilisateurs ayant accès au document (même population que le widget).
- **Update / Delete** : Owners / équipe studio uniquement (tri `Statut`, `Priorite`, `Assigne_a`, `Reponse`).
- Choices Type / Niveau_gene / Statut / Priorite : à peaufiner dans l’UI Grist si besoin (colonnes créées en Text + valeurs métier documentées).

Sans ces règles, tout utilisateur *Editor* du doc peut aussi modifier les retours des autres.

## Alertes / suivi « nouveau retour »

Sans e-mail Grist ni ETL : runbook ops (webhook Mattermost go/no-go + **fallback** vue filtrée `Statut = Nouveau`) → [`alertes.md`](alertes.md).

**Décision actuelle** : **No-go** Mattermost direct (smoke HTTP 400 decode payload) → process actif = [fallback vue `Nouveau`](alertes.md#fallback-opérationnel-process-actif-tant-que-no-go).

## Hors scope (widget)

- Notifications depuis le **bundle** (mail, Mattermost, Tchap) — secrets interdits ; config éventuelle = doc Grist uniquement ([`alertes.md`](alertes.md))
- Boucle auto « informé·e » (champ `Reponse` + statut Fait/Écarté) — promise UX documentée, pas d’automation
- ETL / transformateur JSON Grist → Mattermost
- Filtrer / trier les retours selon un workflow de traitement (géré hors front : présence des lignes dans la table)
