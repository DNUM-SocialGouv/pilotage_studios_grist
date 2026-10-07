# Feedback utilisateur (widget flottant)

Bouton fixe « Un retour ? » (bas droite) présent sur **tous** les écrans du Custom Widget. Ouvre un panneau pour signaler une anomalie, une suggestion ou une question. Chaque envoi crée une ligne dans la table Grist **`Kanban`** (`Nature=Feedback`, `Colonne_kanban=feedback`).

Référence design : [`design/feedback_widget/`](../../../design/feedback_widget/).

## Comportement

| Élément | Détail |
|---------|--------|
| Montage | [`WidgetLayout`](../../../src/layout/WidgetLayout.tsx) — pas une route dédiée |
| Types | Anomalie / Suggestion / Question (segmentés) → badge carte |
| Titre | Obligatoire (max 140) — écrit dans `Titre` **et** `Resume` (même texte) |
| Détail (`Message`) | Optionnel ; si vide = copie du titre ; rendu Markdown léger (`MissionProse`) — liens `http(s)`, pages internes `[libelle](/chemin)`, code inline / blocs fence |
| Page / thème | **Automatiques** depuis l’URL (pathname) — pas de select UI ; remplissent `Theme` et `Page` |
| Niveau de gêne | Visible seulement si type = Anomalie |
| Identité | **Signature silencieuse** : prénom (fiche Équipe session ou parse e-mail) + e-mail de session — pas de select |
| Contexte technique | Case cochée par défaut (URL widget · UA · résolution) |
| Après envoi | Confirmation ; *Fermer* / *Un autre retour* ; rappel « Vos retours » sur l’accueil |
| Sans e-mail session | Envoi **bloqué** + message actionnable |
| Erreur | Message + possibilité de réessayer (panneau reste ouvert) |

## Identité

Signature **silencieuse** depuis la session (`useAclProfil`) :

- `Email` ← e-mail de session (requis pour envoyer)
- `Auteur` ← prénom via `defaultWeeklyAuteurPrenom` (fiche Équipe si connue, sinon début d’e-mail)

Hint lecture seule : « Signé avec votre compte Grist · *prénom* ». Pas de champ éditable, pas de choix dans la liste Équipe.

**Bénéfice** : le filtre « Vos retours » sur l’accueil (`Email` = session) devient fiable — plus de retour « au nom d’autrui ».

## Table Grist `Kanban` (Feedback)

| Colonne | Remplie à l’envoi |
|---------|-------------------|
| `Nature` (= Feedback), `Colonne_kanban` (= feedback) | Oui |
| `Titre`, `Resume` (= même texte que Titre), `Theme` / `Page` (auto pathname), `Type`, `Message` | Oui |
| `Date`, `Auteur`, `Email`, `Niveau_gene`, `Contexte_technique`, `Statut` (= Nouveau) | Oui |
| Guides, `Lien_github`, champs produit | Non (suivi / enrichissement dans Grist ou Admin) |

Écriture widget : **create** via `grist.getTable('Kanban').create`, gardée par [`writeTableAllowlist.ts`](../../../src/security/writeTableAllowlist.ts).  
Update widget (Admin) : **`Colonne_kanban`** (select) + corps **`Resume` / `Message`** (formulaire drawer). Pas d’édition Titre / commentaires.

Lecture widget : `fetchAllowlistedTable('Kanban')` — colonne Feedback = `Nature=Feedback` et `Colonne_kanban=feedback`. Placeholder d’invitation **toujours visible**. **Clic carte** → drawer (`TicketDrawer`) + conversation.

**Ancienne table `Retours`** : migrée vers `Kanban` ; plus utilisée par le widget — archivable / supprimable Owner (après vérif alertes ops).

### Conversation (commentaires)

Table `Kanban_commentaires` : `Cible_id` (= id `Kanban`), `Date`, `Auteur`, `Email`, `Message` (`Cible_type` figé à `Kanban` pour compat colonne existante). Create allowlisté pour tout utilisateur du widget. Pas d’update/delete widget en V1.

Le select auteur des commentaires (conversation) reste distinct du formulaire « Un retour » — voir `TicketConversation`.

### Confidentialité lecture (décision V1)

**Décision produit** : la colonne Feedback est un **kanban partagé interne** — tout utilisateur qui peut lire `Kanban` via les Access Rules voit les messages des autres (prénom + extrait). Acceptable tant que le document reste un cercle restreint Pilotage.

**Confort UX** : le bloc **« Vos retours »** sur l’accueil (`/`) filtre côté widget les cartes Feedback dont `Email` = e-mail de session (liste courte + badges nouveauté ; onglets **Actifs / Archivés** — Livré lus sans badge). Ce filtre **n’est pas** un contrôle d’accès (couche 5) — la feuille de route reste partagée. Si l’audience s’élargit : durcir en Access Rules — HITL Grist, pas de masquage JS seul.

Voir aussi [`accueil/README.md`](../accueil/README.md) (composition Option 3).
## Access Rules (HITL — à appliquer dans Grist)

Recommandation :

| Table | Read | Create | Update / Delete |
|-------|------|--------|-----------------|
| `Kanban` | Population widget | Population widget (feedback) | Owner / `Role_ACL` Admin (colonne + corps `Resume` / `Message`) |
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
