# Feedback utilisateur (widget flottant)

Bouton fixe « Un retour ? » (bas droite) présent sur **tous** les écrans du Custom Widget. Ouvre un panneau pour signaler une anomalie, une suggestion ou une question. Chaque envoi crée une ligne dans la table Grist **`Kanban`** (`Nature=Feedback`, `Colonne_kanban=feedback`).

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

## Table Grist `Kanban` (Feedback)

| Colonne | Remplie à l’envoi |
|---------|-------------------|
| `Nature` (= Feedback), `Colonne_kanban` (= feedback), `Titre` (= Type), `Resume` (1ʳᵉ ligne message) | Oui |
| `Date`, `Auteur`, `Email`, `Type`, `Page`, `Message`, `Niveau_gene`, `Contexte_technique`, `Statut` (= Nouveau) | Oui |
| `Theme`, guides, `Lien_github`, champs produit | Non (suivi / enrichissement dans Grist ou Admin) |

Écriture widget : **create** via `grist.getTable('Kanban').create`, gardée par [`writeTableAllowlist.ts`](../../../src/security/writeTableAllowlist.ts).  
Update widget : **`Colonne_kanban` seulement** (select Admin dans le drawer).

Lecture widget : `fetchAllowlistedTable('Kanban')` — colonne Feedback = `Nature=Feedback` et `Colonne_kanban=feedback`. Placeholder d’invitation **toujours visible**. **Clic carte** → drawer (`TicketDrawer`) + conversation.

### Conversation (commentaires)

Table `Kanban_commentaires` : `Cible_id` (= id `Kanban`), `Date`, `Auteur`, `Email`, `Message` (`Cible_type` figé à `Kanban` pour compat colonne existante). Create allowlisté pour tout utilisateur du widget. Pas d’update/delete widget en V1.

### Confidentialité lecture (décision V1)

**Décision produit** : la colonne Feedback est un **kanban partagé interne** — tout utilisateur qui peut lire `Kanban` via les Access Rules voit les messages des autres (prénom + extrait). Acceptable tant que le document reste un cercle restreint Pilotage.

**Pas** de filtre front « mes retours seulement » (contournable). Si l’audience s’élargit : durcir en Access Rules — HITL Grist, pas de masquage JS.

## Access Rules (HITL — à appliquer dans Grist)

Recommandation :

| Table | Read | Create | Update / Delete |
|-------|------|--------|-----------------|
| `Kanban` | Population widget | Population widget (feedback) | Owner / `Role_ACL` Admin (dont `Colonne_kanban`) |
| `Kanban_commentaires` | Population widget | Population widget | Owner / Admin |

Sans règles Update/Delete, tout utilisateur *Editor* du doc peut aussi modifier les tickets / commentaires des autres.

## Alertes / suivi « nouveau retour »

Sans e-mail Grist ni ETL : runbook ops (webhook Mattermost go/no-go + **fallback** vue filtrée `Statut = Nouveau` sur `Kanban`) → [`alertes.md`](alertes.md).

**Décision actuelle** : **No-go** Mattermost direct (smoke HTTP 400 decode payload) → process actif = [fallback vue `Nouveau`](alertes.md#fallback-opérationnel-process-actif-tant-que-no-go).

## Hors scope (widget)

- Notifications depuis le **bundle** (mail, Mattermost, Tchap) — secrets interdits ; config éventuelle = doc Grist uniquement ([`alertes.md`](alertes.md))
- Boucle auto « informé·e » (champ `Reponse` + statut Fait/Écarté) — promise UX documentée, pas d’automation
- ETL / transformateur JSON Grist → Mattermost
- Filtrer / trier les retours selon un workflow de traitement (géré hors front : présence des lignes dans la table)
