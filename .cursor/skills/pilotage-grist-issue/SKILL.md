---
name: pilotage-grist-issue
description: Traite une issue GitHub du dépôt DNUM-SocialGouv/pilotage_studios_grist (Custom Widget Grist). Use when the user asks to implement or fix an issue on pilotage_studios_grist.
---

# Traiter une issue — pilotage_studios_grist

1. Relire **[AGENTS.md](../../../AGENTS.md)** (iframe, MemoryRouter, allowlist, hors-scope).
2. Consulter **[docs/README.md](../../../docs/README.md)** et le protocole **[DOC-FONCTIONNEL.md](DOC-FONCTIONNEL.md)**.

```bash
gh issue view <NUM> --repo DNUM-SocialGouv/pilotage_studios_grist
```

## Contraintes

- Pas d’IA / secrets LLM dans le widget.
- Pas d’écriture Grist sans demande explicite.
- Données via `grist-plugin-api` uniquement ; tables hors ancre via `fetchAllowlistedTable` seulement.

## Playbook — nouvel écran (ex. Produits [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3))

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
