# AGENTS.md — Pilotage studios Grist (Custom Widget)

Document de référence **technique** pour les agents Cursor sur **ce** dépôt (`pilotage_studios_grist`).

Doc **métier** (parcours) : [`docs/README.md`](docs/README.md).  
Sécurité : [`SECURITY.md`](SECURITY.md).

Repo sœur de [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios) : même document Grist, **code séparé**, rendu dans une **iframe Custom Widget**.

**Grist-first** : toute feature utile aux utilisateurs se conçoit et se livre **d’abord** dans ce widget. L’app web solo suit **en retard**, seulement si besoin perso (portage opt-in — [`docs/portage/`](docs/portage/)). **Pas** de parité d’écrans obligatoire.

Les **skills projet** (`.cursor/skills/`) priment sur les user rules génériques (cursor-devkit, etc.).

### Règle permanente — simplification

Avant d’ajouter un écran, un champ ou un parcours : *« Que peut-on *ne pas* faire ? »*  
Réduire la complexité ; pas d’ajout « au cas où ». Les agents **proposent de couper** avant d’élargir le scope. Succès = usage simple (référence : fiche mission épurée).

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
| `/missions`, `/missions/:id` | Implémenté (liste + fiche + drawer create/edit master) |
| `/cra` | Implémenté (liste lecture Admin) |
| `/cra/declarer` | Implémenté (déclaration freelance — jours + description) |
| `/cra/revue-equipe` | Implémenté (revue manager — jours / description / BDC, même département) |
| `/outils/recap-porteurs` | Implémenté (récap mensuel par portage) |
| `/outils/droits-pages` | Implémenté (Admin : matrice `Droits_pages`) |
| `/equipe`, `/equipe/:id` | Implémenté (liste + fiche lecture) |
| `/produits`, `/produits/:id` | Implémenté (liste + fiche lecture) |
| `/pv` | Stub « À venir » (nav) |
| `/evaluations`, `/analyse` | Stub hors nav |

Nav principale : Accueil, **Mon carnet** (Freelance/Admin, `/cra/declarer`), **Budget** (sous-menu Bons de commande · Plans d’activité · Prestation / CRA · Revue CRA équipe · Procès-verbaux — masqué si aucun enfant accessible, typiquement côté Freelance), Produits, Missions, **Équipe**, **Outils** (Récap porteurs · Droits des pages — Admin). Pas de route `/budget`. `/intervenants` redirige vers `/equipe`.

Entrée MemoryRouter : `/` (`WelcomePage` — **feuille de route kanban** Backlog · En cours · Livré, contenu `src/content/publicRoadmap.ts`). Pas de Header / Footer DSFR app. Pas de React Router `BrowserRouter` (polluerait l’URL Grist).

### Feuille de route (priorité métier)

1 PR par unité bornée + **docs/**. Ordre **Grist-first** (cœur = missions + prestations + CRA) :

1. PA + BDC + lecture Missions + feedback — **livrés**
2. **CRUD prestations** ([#31](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31)) — **livré**
3. **CRA** en tranches : suivre ([#32](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32)) — **livré (lecture)** → récap porteurs ([#48](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48)) — **livré** (`/outils/recap-porteurs`) · déclarer ([#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33)) — **livré V1** (`/cra/declarer`, saisie seule) → revue équipe + BDC ([#70](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70), suite [#34](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34)) — **livré V1** (`/cra/revue-equipe`) → Access Rules `Realise` (#47)
4. **Droits Grist** : préparation ([#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47)) en amont de l’écriture CRA ; Équipe liste/fiche ([#53](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53)) — droits écran ([#54](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54)) et Access Rules table ([#55](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55)) ensuite ; UX « page freelance » **après** Access Rules serveur
5. **Produits** ([#3](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3)) — **livré** (liste + fiche lecture) ; plus tard : forfait ([#36](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36)), dates←CRA ([#37](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/37)), PV, Évaluations
6. Analyse : rester stub (hors scope widget)

Visibilité users : section roadmap sur `/` + issues rédigées selon [`docs/issues-publiques.md`](docs/issues-publiques.md).

---

## 3. Stack & carte `src/`

- React 19, TypeScript, Vite 8, React Router 6 (`MemoryRouter`)
- DSFR `@codegouvfr/react-dsfr` ; barres TTC (missions / dépenses BDC) : `CraTtcStackBar` (même langage que PA/BDC)
- Données : `window.grist.ready` / `onRecords` / `fetchAllowlistedTable` ; table **BDC** via REST `getAccessToken` + [`gristRest.ts`](src/utils/gristRest.ts) (Sofiane / Attachments)
- **Interdit** : embarquer `VITE_GRIST_API_KEY` ou clés LLM dans le bundle

| Zone | Fichiers |
|------|----------|
| Routes | `src/App.tsx` |
| Nav | `src/layout/WidgetNav.tsx` + [`widgetNavItems.ts`](src/layout/widgetNavItems.ts) (`WIDGET_NAV_ITEMS`, groupe Budget) |
| Pages | `src/pages/WelcomePage.tsx`, `Pa*.tsx`, `Bdc*.tsx`, `Missions*.tsx`, `Equipe*.tsx`, `Produits*.tsx`, `CraListView.tsx`, `CraDeclarerPage.tsx`, `CraRevueEquipePage.tsx`, `CraRecapPorteursPage.tsx`, `DroitsPagesAdminPage.tsx`, `StubPage.tsx` |
| Contenu public | [`src/content/publicRoadmap.ts`](src/content/publicRoadmap.ts) (feuille de route accueil) |
| Données | `src/hooks/useGristPaData.ts`, `useBdcDepensesData.ts`, `useMissionsData.ts`, `useEquipeData.ts`, `useEquipeMemberMissionsData.ts`, `GristPaContext.tsx`, `gristMap.ts`, `gristRest.ts`, `gristAccessToken.ts` |
| Sécu | `src/security/embedTrust.ts`, `NothingHerePage.tsx`, `ensureFreshBuild.ts`, `fetchTableAllowlist.ts`, `writeTableAllowlist.ts` |
| Finance / refs | `src/utils/paFinance.ts`, `montantReste.tsx`, `gristReferences.ts`, `equipeBadge.ts` |
| Dépenses BDC | `BdcDepensesPanel`, `BdcDepensesByPrestationTable`, `groupSuiviByMissionEnfant.ts`, `CraTtcStackBar` |
| Missions | `MissionsListView`, `MissionsDetailView`, `useMissionsData`, `MissionFormDrawer`, `MissionEnfantDrawer`, `craByMission.ts` |
| Équipe | `EquipeListView`, `EquipeDetailView`, `EquipeLayout`, `useEquipeData`, `useEquipeMemberMissionsData`, `EquipeFicheMissionsSection`, `equipeList.ts`, `equipeMemberPrestations.ts` |
| CRA | `CraListView`, `CraDeclarerPage`, `CraRevueEquipePage`, `CraRecapPorteursPage`, `craList.ts`, `craDeclarer.ts`, `craRevueEquipe.ts`, `craExport.ts`, `realiseGristWrite.ts` |
| Feedback | `FeedbackWidget`, `createRetoursRecord`, `feedbackEquipe`, `writeTableAllowlist` |

---

## 4. Tables Grist (V1)

| Usage | tableId |
|-------|---------|
| Ancre widget + liste PA | `Plan_activite` |
| Finance PA + écrans BDC (accès full) | `BDC`, `Constatations`, `Commandes_Sofiane` |
| Onglet Dépenses fiche BDC **ou** écrans `/missions` **ou** `/cra` **ou** `/cra/declarer` **ou** `/cra/revue-equipe` **ou** `/outils/recap-porteurs` **ou** `/equipe` **ou** `/produits` (lazy, lecture) | `Realise`, `Missions`, `Missions_enfants` (`Mission_parent` + `Titre_de_la_prestation`, fallbacks lecture `Libelle` / texte `Mission_enfant`), `Equipe` (annuaire `/equipe` + `Portage` récap porteurs + identité déclaration / revue), `Tableau_de_pilotage_SDPC_Produits_SDPC` (catalogue `/produits`) |
| Fiche `/equipe/:id` (lazy, lecture — section Missions & prestations) | `Missions`, `Missions_enfants` (filtre `Intervenant` = personne) ; avatar = `Equipe.Avatar` (seed) |
| Fiche `/produits/:id` (lazy, lecture — onglet Missions : prestations + CRA) | `Missions` (filtre `Produit_SDPC`), `Missions_enfants`, `Equipe`, `Realise` (via `loadMissionsTables`) |
| Feedback widget (écriture create + lecture liste accueil) | `Retours` |
| Droits pages session (nav + gardes) | `Acl_profil` (lecture ; create auto si absente ; `Page_*` formules ← `Droits_pages`) |
| Matrice écrans Admin (`/outils/droits-pages`) | `Droits_pages` (lecture + update ; Owner / Admin ACL) |
| Select auteur feedback (lecture lazy) | `Equipe` (déjà allowlistée) |

**Allowlist lecture** : uniquement via [`src/security/fetchTableAllowlist.ts`](src/security/fetchTableAllowlist.ts) (`FETCH_TABLE_ALLOWLIST`, `fetchAllowlistedTable`) **et** REST `fetchGristRecordsViaToken` (même allowlist). Pas d’ID libre depuis l’UI. Nouvelle table lecture = MAJ ce fichier + §4 + docs + [`SECURITY.md`](SECURITY.md).

**Allowlist écriture** : [`src/security/writeTableAllowlist.ts`](src/security/writeTableAllowlist.ts) — `Retours` (create) ; `Missions` (create + update drawer) ; `Missions_enfants` (create + update drawer prestation) ; `Realise` (create + update déclaration CRA + revue équipe) ; `Acl_profil` (create only, fiche session auto) ; `Droits_pages` (update only, page Admin). Pas de delete widget. `Retours` est aussi en **lecture** (`FETCH_TABLE_ALLOWLIST`) pour la colonne Feedback de l’accueil.

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
| [`docs/issues-publiques.md`](docs/issues-publiques.md) | Rédaction issues roadmap (repo public) |
| [`docs/portage/`](docs/portage/) | Handoff opt-in vers app sœur (agents) |
| [`docs/fonctionnel/roles/`](docs/fonctionnel/roles/) | Rôles / partage / Access Rules (HITL) |
| [`SECURITY.md`](SECURITY.md) | Menace iframe, secrets, allowlist |
| [`.cursor/skills/pilotage-grist-issue/`](.cursor/skills/pilotage-grist-issue/) | Traiter / créer une issue (+ [`DOC-FONCTIONNEL.md`](.cursor/skills/pilotage-grist-issue/DOC-FONCTIONNEL.md)) |
| [`.cursor/skills/pilotage-grist-pr/`](.cursor/skills/pilotage-grist-pr/) | Ouvrir / merger une PR (+ [`CHECKLIST.md`](.cursor/skills/pilotage-grist-pr/CHECKLIST.md)) |
| [`.cursor/skills/pilotage-grist-code-review/`](.cursor/skills/pilotage-grist-code-review/) | Revue avant merge |
| [`.cursor/skills/grist-custom-widgets/`](.cursor/skills/grist-custom-widgets/) | API Custom Widget (ready / onRecords / fetchTable) |
| [`.cursor/rules/dsfr-tableaux.mdc`](.cursor/rules/dsfr-tableaux.mdc) | Tableaux DSFR |
| [`.cursor/rules/widget-iframe.mdc`](.cursor/rules/widget-iframe.mdc) | Contraintes iframe (always-on) |
| [`.cursor/rules/pilotage-drawers.mdc`](.cursor/rules/pilotage-drawers.mdc) | Drawers : taille fixe SM, pas de sélecteur largeur |
| [`.cursor/rules/pedagogie-non-technique.mdc`](.cursor/rules/pedagogie-non-technique.mdc) | « En clair » : brief non technique en tête des plans / issues / PR / synthèses (always-on) |
| [`.cursor/rules/roles-matrice.mdc`](.cursor/rules/roles-matrice.mdc) | MAJ obligatoire [`docs/fonctionnel/roles/matrice-droits.md`](docs/fonctionnel/roles/matrice-droits.md) si feature / permissions (always-on) |

MCP : [`.cursor/mcp.json.example`](.cursor/mcp.json.example) (serveurs Grist + DSFR). Dans Cursor, les namespaces exposés sont typiquement `user-grist` et `user-dsfr`.

---

## 8. Guide agent

### Avant une feature

1. Relire §1–2 et [`docs/README.md`](docs/README.md) ; **challenger la simplification**.
2. Issue GitHub : skill [`pilotage-grist-issue`](.cursor/skills/pilotage-grist-issue/SKILL.md) (+ protocole doc) ; si issue **publique / roadmap** → [`docs/issues-publiques.md`](docs/issues-publiques.md).
3. PR : skill [`pilotage-grist-pr`](.cursor/skills/pilotage-grist-pr/SKILL.md) — case **Portage app solo**.
4. Avant merge : skill [`pilotage-grist-code-review`](.cursor/skills/pilotage-grist-code-review/SKILL.md).

### Portage vers l’app web (`pilotage_studios`)

- **Opt-in** uniquement : fiche [`docs/portage/`](docs/portage/) + issue app label `portage-from-grist`.
- Interdit : « syncer tout le widget » / monorepo forcé / bot PR web à chaque merge.
- L’agent web lit la fiche + `docs/fonctionnel/<module>/` du **widget** ; n’importe pas le runtime iframe.

### Fichiers selon la tâche

| Tâche | Lire en priorité |
|-------|------------------|
| Nouvel écran nav | §2, `App.tsx`, `WIDGET_NAV_ITEMS`, stub → playbook skill issue |
| Nouvelle table `fetchTable` | `fetchTableAllowlist.ts`, §4, SECURITY |
| PA / finance | `docs/fonctionnel/pa/`, `paFinance.ts`, `PaListView` / `PaDetailView` |
| BDC | `docs/fonctionnel/bdc/`, `BdcListView` / `BdcDetailView` |
| Missions | `docs/fonctionnel/missions/`, `useMissionsData`, `MissionsListView` / `MissionsDetailView` |
| Équipe | `docs/fonctionnel/equipe/`, `useEquipeData`, `useEquipeMemberMissionsData`, `EquipeLayout` / `EquipeListView` / `EquipeDetailView`, `EquipeAvatar` (seed `Equipe.Avatar` → DiceBear Glyphs) |
| Produits | `docs/fonctionnel/produits/`, `useProduitsData`, `useProduitMissionsData`, `ProduitsLayout` / `ProduitsListView` / `ProduitsDetailView`, `produitsList` |
| Feedback | `docs/fonctionnel/feedback/` (+ [`alertes.md`](docs/fonctionnel/feedback/alertes.md)), `FeedbackWidget`, `writeTableAllowlist` |
| Tableau DSFR | rule `dsfr-tableaux.mdc`, MCP `user-dsfr` |
| Embed / secrets | `embedTrust.ts`, `NothingHerePage`, `ensureFreshBuild`, SECURITY |
| Rôles / ACL document | `docs/fonctionnel/roles/` (+ **matrice-droits.md** registre vivant) ; inventaire via MCP **local** `grist-mcp-server` — hors bundle widget |
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
| Nouvelle table écriture | `writeTableAllowlist.ts` + §4 + SECURITY + docs + confirmation HITL |
| Nouvelle rule / skill | Ligne dans §7 |
| Changement parcours UI | Mettre à jour `docs/fonctionnel/` (même PR) |
| Élargissement surface API / écriture | Lire SECURITY ; confirmation explicite + revue |
| Feature / permissions (rôles, nav, ACL) | MAJ [`docs/fonctionnel/roles/matrice-droits.md`](docs/fonctionnel/roles/matrice-droits.md) (rule `roles-matrice`) |

---

## 10. Hors scope (ne pas recréer sans demande)

- Features IA / assistant
- Écriture Grist hors allowlist (`Retours`, drawer `Missions` / `Missions_enfants` create+update, `Realise` create+update déclaration, `Acl_profil` create auto, `Droits_pages` update Admin) — pas d’update/delete retours, pas de delete missions/prestations/CRA, pas d’édition `Type_prestation` / `Date_de_fin` prestation, pas d’update/delete `Acl_profil`, pas de create/delete lignes `Droits_pages`
- Imports CSV Sofiane
- Remplacer l’app `pilotage_studios`
- Kanban / notifs / mails **dans le widget** ; alertes ops = hors bundle ([`docs/fonctionnel/feedback/alertes.md`](docs/fonctionnel/feedback/alertes.md) — pas d’URL webhook dans git)
