# Prompt Cursor — Implémentation du Widget de feedback

> À coller dans Cursor comme contexte de départ. Le design de référence est dans `design_handoff_feedback_widget/` (README détaillé + captures + prototype `FeedbackWidget.dc.html`).

## Contexte
Application **Pilotage studios SDPC** (DNUM ministères sociaux) — repo `DNUM-SocialGouv/pilotage_studios`, dossier `design/`. L'app est un ensemble de **widgets Grist** (HTML/JS chargés dans Grist), stylés avec le **DSFR** (Système de Design de l'État).

## Objectif
Ajouter un **widget de feedback** : un bouton flottant fixe en bas à droite de chaque écran qui ouvre un panneau. L'utilisateur y signale une **anomalie**, une **suggestion** ou une **question**. Chaque retour est écrit dans une table Grist `Retours`, avec l'identité de l'utilisateur **reprise automatiquement de sa connexion Grist** (jamais saisie).

## Ce qu'il faut faire
1. **Recréer le design** de `FeedbackWidget.dc.html` avec les composants DSFR existants du codebase (`fr-btn`, `fr-input`, `fr-select`, `fr-checkbox-group`, tokens `--background-*` / `--text-*` / `--border-*`). Le prototype est une **référence** — ne pas copier le HTML tel quel, ni le faux fond de page de démo. Voir specs pixel/tokens dans `README.md`.
2. **Récupérer l'identité** via l'API widget Grist (`grist.ready()` puis session/utilisateur courant) → alimenter `userName` / `userEmail` en lecture seule.
3. **Écrire le retour** dans la table `Retours` à l'envoi :
   ```js
   await grist.getTable('Retours').create({ fields: {
     Date: new Date().toISOString(),
     Auteur: userName, Email: userEmail,
     Type: type, Page: page, Message: message,
     Niveau_gene: type === 'Anomalie' ? niveau : '',
     Contexte_technique: joinContext
       ? `${location.href} · ${navigator.userAgent} · ${screen.width}x${screen.height}` : '',
     Statut: 'Nouveau',
   }});
   ```
4. **Gérer les états** : `sending` (spinner sur le bouton d'envoi), `error` (échec Grist → message + réessayer), puis écran de confirmation.

## Comportement clé
- Bouton flottant `fixed; right:24px; bottom:24px` → ouvre/ferme le panneau (`fixed; right:24px; bottom:92px`).
- 3 types segmentés ; le texte d'aide du message change selon le type ; champ « Niveau de gêne » visible **uniquement si Anomalie**.
- Message **obligatoire** → bouton d'envoi désactivé tant qu'il est vide (seul champ requis).
- Case « Joindre le contexte technique » cochée par défaut.
- Après envoi : écran de confirmation « Merci, c'est enregistré ! » + boutons *Fermer* / *Un autre retour* (réinitialise).

## Table Grist `Retours` (à créer)
`Date, Auteur, Email, Type, Page, Message, Niveau_gene, Contexte_technique, Statut (Nouveau→À trier→Planifié→Fait→Écarté), Priorite, Assigne_a, Lien_ticket, Reponse`.

## Suivi (à prévoir, non bloquant)
- Vue **Kanban Grist** par `Statut`.
- **Notification** (webhook/formule) des nouveaux retours dans un canal (Tchap/Mattermost) ou par mail.
- **Boucle de retour** : mail auto à l'auteur quand le statut passe à *Fait/Écarté* (champ `Reponse`).

## Points d'attention
- Aligner la liste « Page concernée » sur la nav réelle de l'app (le prototype liste : Accueil, BDC, PA, Produits, Missions, Intervenants, CRA, PV, Évaluations, Analyse, Autre).
- Le widget doit s'intégrer dans **chaque écran** sans gêner le contenu (z-index élevé, `position:fixed`).
- Accessibilité : `aria-label`, `aria-expanded` sur le bouton, `aria-pressed` sur les boutons de type, `<fieldset>/<legend>` conservés.

## Fichiers de référence
- `design_handoff_feedback_widget/README.md` — specs complètes (layout, tokens, états, schéma Grist).
- `design_handoff_feedback_widget/FeedbackWidget.dc.html` — prototype interactif.
- `design_handoff_feedback_widget/screenshots/` — 3 états (anomalie, suggestion rempli, confirmation).
