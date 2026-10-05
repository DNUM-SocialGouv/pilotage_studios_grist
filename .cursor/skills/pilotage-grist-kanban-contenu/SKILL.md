---
name: pilotage-grist-kanban-contenu
description: >-
  Rédige Resume / Message des cartes kanban Produit en langage métier
  (non technique), sans liens PR/GitHub sauf demande explicite.
  Use when creating or updating Nature=Produit Kanban cards, or when
  Message/Resume look too technical (PR links, SHA, jargon).
---

# Contenu des cartes kanban — langage métier

## En clair

Les cartes de la **feuille de route** sont lues dans le widget par des
personnes **non techniques**. Titre, résumé et détail doivent parler
**missions, retours, CRA, bons de commande** — pas de jargon de dépôt
(PR, SHA, merge, allowlist…).

Complète [`pilotage-grist-kanban`](../pilotage-grist-kanban/SKILL.md)
(sync colonnes / HITL) : ce skill couvre **uniquement le texte** des
cartes `Nature=Produit`.

## Quand l’appliquer

- Create ou update d’une carte Produit (`Resume`, `Message`, `Titre`)
- Revue d’une carte dont le détail cite des PR / SHA / jargon
- Passage **Livré** : réécrire le `Message` en bénéfice + état, pas en
  changelog git

## Champs

| Champ | Rôle | Longueur |
|-------|------|----------|
| `Titre` | Intention visible sur la carte | Court, métier |
| `Resume` | Une phrase : **bénéfice** pour l’utilisateur | ~1–2 phrases |
| `Message` | Corps drawer : **court paragraphe** (bénéfice + état) | Pas une ligne sèche |

`Lien_github` : colonne **séparée** (optionnelle). Ce n’est **pas** le
corps de la carte. Ne pas recopier l’URL dans `Message` / `Resume`
sauf **demande explicite** du porteur.

## Règles

### Faire

- Langage **métier / non technique** — même esprit que
  [`docs/issues-publiques.md`](../../../docs/issues-publiques.md) et la
  rule [`pedagogie-non-technique`](../../rules/pedagogie-non-technique.mdc)
- Ouvrir le `Message` par un mini **« En clair »** (bénéfice concret)
- Indiquer l’**état** en français courant : « en conception »,
  « disponible dans le widget », « à tester », « en attente d’arbitrage »
- Markdown léger OK : titres `##`, listes courtes, **gras** parcimonieux
- L’Admin peut corriger ensuite dans le drawer (édition corps)

### Ne pas faire

- Liens PR / issues GitHub dans `Message` ou `Resume` (sauf demande explicite)
- SHA, tip de branche, « MERGED », numéros de commit
- Jargon technique non glosé : allowlist, MemoryRouter, ACL, CSP, fetchTable,
  iframe, MCP, HITL (dans le corps carte), etc.
- Une seule ligne sèche du type « PR #12 merged » ou « Refonte nav »
- Inventaire de fichiers / commandes npm dans le détail utilisateur

### Où placer le technique

Si un détail technique est indispensable pour l’équipe :

- Issue GitHub (template public) **ou**
- Champ `Contexte_technique` (si rempli) **ou**
- Commentaire interne hors widget

**Pas** dans `Resume` / `Message` destinés à la lecture métier.

## Gabarit `Message` (create / maj)

```markdown
## En clair

<Une à trois phrases : problème vécu + bénéfice attendu ou livré,
sans jargon.>

**État** : <où en est-on, en français courant — pas de lien PR.>
```

Variante courte (update mineur) : un seul paragraphe bénéfice + état,
sans sous-titres.

## Exemples

### Mauvais

```text
PR #105 MERGED (272c5e8). Polish Weekly Ops dark mode + drawer.
```

```text
Refonte accueil + nav
```

### Bon

```markdown
## En clair

Weekly Ops est plus confortable au quotidien : thème sombre, sujets
ouverts dans un tiroir, et un bouton « Nouveau sujet » bien visible.

**État** : disponible dans le widget (écran Weekly).
```

```text
Sur l’accueil, chacun retrouve ses propres retours (statut + badge
si réponse ou changement d’avancement). Conception validée — pas
encore affiché dans le widget.
```

## Lien avec la sync kanban

1. Suivre [`pilotage-grist-kanban`](../pilotage-grist-kanban/SKILL.md)
   pour create / move (HITL, `Cle`, `Ordre`, colonnes).
2. **Avant** l’écriture MCP : rédiger `Titre` / `Resume` / `Message`
   selon **ce** skill.
3. Après merge produit : en proposant `livre`, **réécrire** le `Message`
   si le corps actuel est un dump de PR.

## Liens

- Sync : [`pilotage-grist-kanban`](../pilotage-grist-kanban/SKILL.md)
- Issues publiques : [`docs/issues-publiques.md`](../../../docs/issues-publiques.md)
- Pédagogie : [`.cursor/rules/pedagogie-non-technique.mdc`](../../rules/pedagogie-non-technique.mdc)
