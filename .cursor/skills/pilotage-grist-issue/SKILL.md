---
name: pilotage-grist-issue
description: Traite une issue GitHub du dépôt DNUM-SocialGouv/pilotage_studios_grist (Custom Widget Grist). Use when the user asks to implement or fix an issue on pilotage_studios_grist.
---

# Traiter une issue — pilotage_studios_grist

Relire **AGENTS.md** en début de tâche (iframe, pas de clé API, MemoryRouter).

```bash
gh issue view <NUM> --repo DNUM-SocialGouv/pilotage_studios_grist
```

## Contraintes

- Pas d’IA / secrets LLM dans le widget.
- Pas d’écriture Grist sans demande explicite.
- Nouvel écran : route MemoryRouter + entrée `WIDGET_NAV_LINKS` ; retirer le stub correspondant.
- Données via `grist-plugin-api` uniquement.

## Validation

```bash
npm run lint && npm run build
```

Tester dans Grist (localhost:5175 ou URL Pages) avec accès **full**.
