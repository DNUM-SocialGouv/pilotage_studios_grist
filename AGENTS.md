# AGENTS.md — Pilotage studios Grist (Custom Widget)

Document de référence pour les agents Cursor sur **ce** dépôt (`pilotage_studios_grist`).

Repo sœur de [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios) : même document Grist, **code séparé**, rendu dans une **iframe Custom Widget**.

---

## 1. Contexte

| | App `pilotage_studios` | Ce widget |
|--|------------------------|-----------|
| Exécution | `npm run dev` navigateur | iframe Grist (URL Pages ou localhost) |
| Auth données | `VITE_GRIST_API_KEY` (REST) | `grist-plugin-api` (ACL utilisateur Grist) |
| Chrome UI | Header Marianne + Footer | **Navigation seule** (`WidgetNav`) |
| IA `/analyse` | Backend `/api/assistant/*` | **Hors scope** (stub) |

- **Document Grist** : `nei9DeARs5Eo` (pilotage V2).
- **Installation Grist** : widget Custom → URL personnalisée → accès **full** → Select Data = `Plan_activite` (table ancre V1).

---

## 2. Routes (MemoryRouter)

| Path | Statut V1 |
|------|-----------|
| `/pa`, `/pa/:id` | Implémenté (liste + fiche) |
| `/bdc`, `/produits`, `/missions`, `/intervenants`, `/cra`, `/pv`, `/evaluations` | Stub « À venir » |
| `/analyse` | Stub — réservé à l’app (secrets LLM) |

Pas de Header / Footer DSFR app. Pas de React Router `BrowserRouter` (polluerait l’URL Grist).

---

## 3. Stack

- React 19, TypeScript, Vite 8, React Router 6 (`MemoryRouter`)
- DSFR `@codegouvfr/react-dsfr`
- Données : `window.grist.ready` / `onRecords` / `docApi.fetchTable`
- **Interdit** : embarquer `VITE_GRIST_API_KEY` ou clés LLM dans le bundle

Sécurité : voir [SECURITY.md](SECURITY.md) — URL Pages publique ≠ données publiques ; menace = JS compromis + session Grist utilisateur.

---

## 4. Tables Grist (V1)

| Usage | tableId |
|-------|---------|
| Ancre widget + liste PA | `Plan_activite` |
| Finance PA (si accès full) | `BDC`, `Constatations`, `Commandes_Sofiane` |

---

## 5. Dev & publish

```bash
npm ci
npm run dev          # http://localhost:5175 — coller dans Grist
npm run build        # dist/ pour Pages
```

CI : `.github/workflows/pages.yml` → GitHub Pages.

URL attendue : `https://dnum-socialgouv.github.io/pilotage_studios_grist/`

---

## 6. Skills & rules Cursor

| Fichier | Usage |
|---------|--------|
| `.cursor/skills/pilotage-grist-issue/` | Traiter / créer une issue |
| `.cursor/skills/pilotage-grist-pr/` | Ouvrir / merger une PR |
| `.cursor/skills/grist-custom-widgets/` | Réf. API Custom Widget (ready / onRecords / fetchTable) |
| `.cursor/rules/dsfr-tableaux.mdc` | Tableaux DSFR |
| `.cursor/rules/widget-iframe.mdc` | Contraintes iframe Custom Widget |

MCP : `.cursor/mcp.json.example` (Grist + DSFR).

---

## 7. Hors scope (ne pas recréer sans demande)

- Features IA / assistant
- Écriture Grist (édition cellules)
- Imports CSV Sofiane
- Remplacer l’app `pilotage_studios`
