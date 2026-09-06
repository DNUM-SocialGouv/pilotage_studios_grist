---
name: pilotage-grist-code-review
description: Revue de code avant merge pour DNUM-SocialGouv/pilotage_studios_grist (widget Grist, DSFR, sécurité secrets).
---

# Revue — pilotage_studios_grist

Checklist : [../pilotage-grist-pr/CHECKLIST.md](../pilotage-grist-pr/CHECKLIST.md).

Points critiques :

1. **Secrets** — aucune clé dans le bundle / `.env` commités.
2. **Iframe** — MemoryRouter, WidgetNav seule, `grist.ready` / `docApi`.
3. **DSFR** — tableaux / nav conformes aux rules `.cursor/rules/`.
4. **IA** — ne pas introduire d’appels LLM sans backend dédié hors Pages.
5. **Régression PA** — liste + fiche + finance (accès full).
