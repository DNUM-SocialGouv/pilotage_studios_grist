# AGENTS.md — Pilotage studios Grist (Custom Widget)

Document de référence **technique** pour les agents Cursor sur **ce** dépôt (`pilotage_studios_grist`).

Doc **métier** (parcours) : [`docs/README.md`](docs/README.md).  
Sécurité : [`SECURITY.md`](SECURITY.md).

Repo sœur de [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios) : même document Grist, **code séparé**, rendu dans une **iframe Custom Widget**.

Les **skills projet** (`.cursor/skills/`) priment sur les user rules génériques (cursor-devkit, etc.).

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
- **Config figée** : ne pas changer Select Data pour chaque nouvel écran. Une iframe + `MemoryRouter` = toute l’app ; tables hors ancre via `fetchAllowlistedTable`.

---

## 2. Routes (MemoryRouter)

| Path | Statut V1 |
|------|-----------|
| `/` | Accueil (welcome) — entrée par défaut |
| `/pa`, `/pa/:id` | Implémenté (liste + fiche) |
| `/bdc`, `/bdc/:id` | Implémenté (liste + fiche) |
| `/produits`, `/missions`, `/intervenants`, `/cra`, `/pv` | Stub « À venir » (nav) |
| `/evaluations`, `/analyse` | Stub hors nav |

Entrée MemoryRouter : `/` (`WelcomePage`). Pas de Header / Footer DSFR app. Pas de React Router `BrowserRouter` (polluerait l’URL Grist).

### Feuille de route pages

1 PR par entrée de nav (liste + fiche + liens croisés + **docs/**) :

1. PA + BDC (livrés sur `main`)
2. **Produits** (prochaine — [#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3))
3. Missions → Intervenants → CRA → PV → Évaluations (priorité métier)
4. Analyse : rester stub (hors scope widget)

---

## 3. Stack & carte `src/`

- React 19, TypeScript, Vite 8, React Router 6 (`MemoryRouter`)
- DSFR `@codegouvfr/react-dsfr`
- Données : `window.grist.ready` / `onRecords` / `fetchAllowlistedTable` ; table **BDC** via REST `getAccessToken` + [`gristRest.ts`](src/utils/gristRest.ts) (Sofiane / Attachments)
- **Interdit** : embarquer `VITE_GRIST_API_KEY` ou clés LLM dans le bundle

| Zone | Fichiers |
|------|----------|
| Routes | `src/App.tsx` |
| Nav | `src/layout/WidgetNav.tsx` (`WIDGET_NAV_LINKS`) |
| Pages | `src/pages/WelcomePage.tsx`, `Pa*.tsx`, `Bdc*.tsx`, `StubPage.tsx` |
| Données | `src/hooks/useGristPaData.ts`, `GristPaContext.tsx`, `gristMap.ts`, `gristRest.ts`, `gristAccessToken.ts` |
| Sécu | `src/security/embedTrust.ts`, `NothingHerePage.tsx`, `ensureFreshBuild.ts`, `fetchTableAllowlist.ts` |
| Finance / refs | `src/utils/paFinance.ts`, `montantReste.tsx`, `gristReferences.ts`, `equipeBadge.ts` |

---

## 4. Tables Grist (V1)

| Usage | tableId |
|-------|---------|
| Ancre widget + liste PA | `Plan_activite` |
| Finance PA + écrans BDC (accès full) | `BDC`, `Constatations`, `Commandes_Sofiane` |

**Allowlist** : uniquement via [`src/security/fetchTableAllowlist.ts`](src/security/fetchTableAllowlist.ts) (`FETCH_TABLE_ALLOWLIST`, `fetchAllowlistedTable`) **et** REST `fetchGristRecordsViaToken` (même allowlist). Pas d’ID libre depuis l’UI. Nouvelle table = MAJ ce fichier + §4 + docs + [`SECURITY.md`](SECURITY.md).

**BDC** : chargée via `docApi.getAccessToken({ readOnly: true })` → REST `/tables/BDC/records?auth=…` (jeton court, droits utilisateur) — pas de clé API dans le bundle. Attachments devis idem.

---

## 5. Dev & publish

```bash
npm ci
npm run dev          # http://localhost:5175 — coller dans Grist
npm run lint         # = tsc --noEmit
npm run test         # node:test (helpers purs)
npm run build        # tsc + vite build (dist/ pour Pages)
```

CI : `.github/workflows/pages.yml` — job `build` sur PR et `main` ; deploy Pages uniquement sur push `main`.

URL attendue : `https://dnum-socialgouv.github.io/pilotage_studios_grist/`

---

## 6. Git — branches et PR (obligatoire)

**Interdit** : commit / push directs sur `main` (branche protégée : PR + check CI `build`).

| Convention | Exemple |
|------------|---------|
| Issue | `issue-12-liste-bdc` |
| Feature | `feat/missions-list` |
| Fix | `fix/embed-trust` |
| Chore | `chore/agents-docs` |

Flux : branche → `npm run lint && npm run build` → push → `gh pr create` → CI verte → merge (`gh pr merge --delete-branch`).

Workspace Cursor : ouvrir **uniquement** ce dépôt pour le widget — ne pas développer le widget depuis `pilotage_studios` / `.tmp-pilotage_studios_grist`.

---

## 7. Skills, rules & docs

| Fichier | Usage |
|---------|--------|
| [`docs/README.md`](docs/README.md) | Doc fonctionnelle (parcours métier) |
| [`docs/fonctionnel/roles/`](docs/fonctionnel/roles/) | Rôles / partage / Access Rules (HITL) |
| [`SECURITY.md`](SECURITY.md) | Menace iframe, secrets, allowlist |
| [`.cursor/skills/pilotage-grist-issue/`](.cursor/skills/pilotage-grist-issue/) | Traiter / créer une issue (+ [`DOC-FONCTIONNEL.md`](.cursor/skills/pilotage-grist-issue/DOC-FONCTIONNEL.md)) |
| [`.cursor/skills/pilotage-grist-pr/`](.cursor/skills/pilotage-grist-pr/) | Ouvrir / merger une PR (+ [`CHECKLIST.md`](.cursor/skills/pilotage-grist-pr/CHECKLIST.md)) |
| [`.cursor/skills/pilotage-grist-code-review/`](.cursor/skills/pilotage-grist-code-review/) | Revue avant merge |
| [`.cursor/skills/grist-custom-widgets/`](.cursor/skills/grist-custom-widgets/) | API Custom Widget (ready / onRecords / fetchTable) |
| [`.cursor/rules/dsfr-tableaux.mdc`](.cursor/rules/dsfr-tableaux.mdc) | Tableaux DSFR |
| [`.cursor/rules/widget-iframe.mdc`](.cursor/rules/widget-iframe.mdc) | Contraintes iframe (always-on) |

MCP : [`.cursor/mcp.json.example`](.cursor/mcp.json.example) (serveurs Grist + DSFR). Dans Cursor, les namespaces exposés sont typiquement `user-grist` et `user-dsfr`.

---

## 8. Guide agent

### Avant une feature

1. Relire §1–2 et [`docs/README.md`](docs/README.md).
2. Issue GitHub : skill [`pilotage-grist-issue`](.cursor/skills/pilotage-grist-issue/SKILL.md) (+ protocole doc).
3. PR : skill [`pilotage-grist-pr`](.cursor/skills/pilotage-grist-pr/SKILL.md).
4. Avant merge : skill [`pilotage-grist-code-review`](.cursor/skills/pilotage-grist-code-review/SKILL.md).

### Fichiers selon la tâche

| Tâche | Lire en priorité |
|-------|------------------|
| Nouvel écran nav | §2, `App.tsx`, `WIDGET_NAV_LINKS`, stub → playbook skill issue |
| Nouvelle table `fetchTable` | `fetchTableAllowlist.ts`, §4, SECURITY |
| PA / finance | `docs/fonctionnel/pa/`, `paFinance.ts`, `PaListView` / `PaDetailView` |
| BDC | `docs/fonctionnel/bdc/`, `BdcListView` / `BdcDetailView` |
| Tableau DSFR | rule `dsfr-tableaux.mdc`, MCP `user-dsfr` |
| Embed / secrets | `embedTrust.ts`, `NothingHerePage`, `ensureFreshBuild`, SECURITY |
| Rôles / ACL document | `docs/fonctionnel/roles/` ; inventaire via MCP **local** `grist-mcp-server` (`grist_list_doc_access` / `grist_access_gap_report`) — hors bundle widget |
| Exploration Grist | MCP `user-grist` (lecture) — **pas** de clé dans le bundle |

### Validation

- `npm run lint && npm run build`
- Smoke iframe Grist (`localhost:5175` ou URL Pages stable) : accès **full**, Select Data = `Plan_activite`

---

## 9. Maintenance

| Événement | Action |
|-----------|--------|
| Stub → écran livré | §2 + `App.tsx` + nav ; créer `docs/fonctionnel/<module>/` ; sommaire docs |
| Nouvelle table `fetchTable` | `fetchTableAllowlist.ts` + §4 + SECURITY + docs |
| Nouvelle rule / skill | Ligne dans §7 |
| Changement parcours UI | Mettre à jour `docs/fonctionnel/` (même PR) |
| Élargissement surface API / écriture | Lire SECURITY ; confirmation explicite + revue |

---

## 10. Hors scope (ne pas recréer sans demande)

- Features IA / assistant
- Écriture Grist (édition cellules)
- Imports CSV Sofiane
- Remplacer l’app `pilotage_studios`
