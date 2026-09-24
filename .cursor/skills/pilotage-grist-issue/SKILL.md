---
name: pilotage-grist-issue
description: Traite une issue GitHub du dépôt DNUM-SocialGouv/pilotage_studios_grist (Custom Widget Grist). Use when the user asks to implement or fix an issue on pilotage_studios_grist.
---

# Traiter une issue — pilotage_studios_grist

1. Relire **[AGENTS.md](../../../AGENTS.md)** (iframe, MemoryRouter, allowlist, hors-scope).
2. Consulter **[docs/README.md](../../../docs/README.md)** et le protocole **[DOC-FONCTIONNEL.md](DOC-FONCTIONNEL.md)**.
3. **Kanban** (si sujet **produit / correctif visible** utilisateurs ; sinon `N/A kanban : …`) : lire skill **[pilotage-grist-kanban](../pilotage-grist-kanban/SKILL.md)** — matcher / proposer create ou `backlog`→`en_cours` ; **HITL** avant écriture MCP.

```bash
gh issue view <NUM> --repo DNUM-SocialGouv/pilotage_studios_grist
```

## Contraintes

- Pas d’IA / secrets LLM dans le widget.
- Pas d’écriture Grist sans demande explicite. Exception **agents uniquement** : sync feuille de route via MCP + skill kanban **après OK** — **pas** d’élargissement des writes widget (`getTable`).
- Données via `grist-plugin-api` uniquement ; tables hors ancre via `fetchAllowlistedTable` seulement.
- **Simplification** : avant d’élargir le scope, proposer ce qu’on *ne fait pas* (voir AGENTS.md).
- Issues **publiques** / roadmap : rédiger selon [`docs/issues-publiques.md`](../../../docs/issues-publiques.md).

## Créer une issue (roadmap / métier)

Préférer le template [`docs/issues-publiques.md`](../../../docs/issues-publiques.md). Brancher l’URL GitHub optionnelle dans la table Grist `Kanban` (`Lien_github`) via skill kanban (create en `backlog`, HITL).

## Playbook — nouvel écran (ex. prochaines : prestations [#31](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31), pas Produits en priorité)
1. Route `MemoryRouter` dans `src/App.tsx` (liste + fiche si besoin) ; retirer le stub correspondant.
2. Entrée déjà dans `WIDGET_NAV_LINKS` (ou l’ajouter) — pas de `BrowserRouter`.
3. Si nouvelle table : étendre `src/security/fetchTableAllowlist.ts` + `AGENTS.md` §4 + SECURITY.
4. Select Data reste `Plan_activite` (ancre figée).
5. Doc : créer / MAJ `docs/fonctionnel/<module>/` (même PR) — voir DOC-FONCTIONNEL.
6. Liens croisés vers écrans déjà livrés (`/pa`, `/bdc`, …).

## Validation

```bash
npm run lint && npm run build
```

Tester dans Grist (`localhost:5175` ou URL Pages) avec accès **full**.
