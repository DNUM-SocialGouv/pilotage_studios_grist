---
name: pilotage-grist-code-review
description: Revue de code avant merge pour DNUM-SocialGouv/pilotage_studios_grist (widget Grist, DSFR, sécurité secrets).
---

# Revue — pilotage_studios_grist

Checklist : [../pilotage-grist-pr/CHECKLIST.md](../pilotage-grist-pr/CHECKLIST.md).

Points critiques :

1. **Secrets** — aucune clé dans le bundle / `.env` commités.
2. **Iframe** — MemoryRouter, WidgetNav seule, `getEmbedTrust`, `grist.ready` / `fetchAllowlistedTable`.
3. **Allowlist** — pas d’appel `docApi.fetchTable` hors `src/security/fetchTableAllowlist.ts`.
4. **DSFR** — tableaux / nav conformes aux rules `.cursor/rules/`.
5. **IA** — ne pas introduire d’appels LLM sans backend dédié hors Pages.
6. **Docs** — `docs/fonctionnel/` alignée ou N/A ; `AGENTS.md` §2/§4 à jour si routes / tables.
7. **Régression** — PA + BDC (liste, fiche, liens croisés, états full / denied).
