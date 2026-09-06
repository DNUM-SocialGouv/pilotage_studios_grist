# Sécurité — Custom Widget Grist

## Ce que l’URL publique expose (et n’expose pas)

| Exposé | Non exposé |
|--------|------------|
| Le **code** JavaScript/CSS du widget (Pages) | Les **données** du document Grist |
| Le fait qu’un widget Pilotage existe (si on inspecte le JS) | Clés API Grist / LLM (aucune dans le bundle) |

Ouvrir `https://…github.io/pilotage_studios_grist/` **seul** (hors iframe Grist) :

- n’affiche **pas** l’UI métier (pas de menu, pas d’Alert) — page morte « Rien à afficher. » (`NothingHerePage` via `getEmbedTrust`) ;
- n’affiche aucune ligne métier : pas de session Grist, pas de `postMessage` parent.

Les données n’apparaissent que si :

1. un utilisateur **authentifié** ouvre le document Grist,
2. avec ce widget **embarqué** et un niveau d’accès accordé,
3. via le canal `grist-plugin-api` (droits = ceux de l’utilisateur).

Le garde-fou hors iframe est de l’**obscurcissement UX / OPSEC**, pas un contrôle d’accès fort : le JS reste téléchargeable.

En **DEV** (`npm run dev`), le gate est contourné pour faciliter le travail local hors iframe.

## Menace principale

**Compromission du JS hébergé** (compte GitHub, supply chain npm, Pages) → code malveillant exécuté **chez les collègues** qui ont le widget ouvert → exfiltration / modification via l’accès widget (`full`).

Ce n’est **pas** « tout Internet lit notre Grist » ; c’est « un attaquant qui contrôle l’URL du widget agit avec les droits des utilisateurs Grist qui le chargent ».

## Garde-fous en place (V1)

1. **Aucun secret** dans le dépôt / bundle (`VITE_GRIST_API_KEY`, clés LLM interdits).
2. **Contrôle d’embed** (`src/security/embedTrust.ts`) : refuse `grist.ready` si l’iframe a un parent non Grist ; en prod hors iframe / embed non fiable → `NothingHerePage` (pas de nav).
3. **Allowlist** des `fetchTable` : uniquement via `fetchAllowlistedTable` (`src/security/fetchTableAllowlist.ts`) — refus runtime hors liste, pas d’ID libre côté UI.
4. **Lecture seule métier** V1 : pas d’API d’écriture dans les hooks.
5. **Téléchargement attachments** : `docApi.getAccessToken({ readOnly: true })` → REST `?auth=` (jeton court, scoped doc / utilisateur). **Pas** de `VITE_GRIST_API_KEY`.
6. **CSP** injectée au build (meta) + script API depuis `grist.numerique.gouv.fr` (sans `eval` ; `docs.getgrist.com` est en mode eval et casse sous CSP).
7. **Pas de source maps** en production.
8. **Repo** : revue PR / protection de `main` recommandées (org).
9. **Dependabot / `npm audit`** dans la CI Pages.
10. **Auto-bust cache** (`version.json` + `ensureFreshBuild`) : après un déploiement Pages, l’iframe se recharge seule si le HTML/JS en cache est périmé — URL Grist stable, sans `?v=` manuel.

## Limites GitHub Pages

- Pas de header HTTP `Content-Security-Policy: frame-ancestors …` (meta CSP ne le couvre pas) → le contrôle parent est fait en JS.
- Le JS reste téléchargeable : ne pas y mettre de logique « secrète ».
- L’URL Pages est **publique** même si le dépôt source devient privé (sauf Pages privés Enterprise).
- Sur org GitHub **Free**, Pages n’est disponible que depuis un **repo public** : passer le dépôt en privé **casse** Pages tant que l’org n’est pas au moins **Team** (ou hébergement ailleurs).

## Durcissement org recommandé

- Branch protection `main` : PR obligatoire, pas de push direct.
- 2FA sur les comptes avec droit d’écriture (déjà exigible au niveau org si activé).
- Restreindre qui peut modifier le workflow Pages.
- Surveiller les releases / commits sur `main`.
- Moyen terme : upgrade org **Team** → repo privé (source moins exposée) + gate UI inchangé sur l’URL Pages.

## Si incident (JS compromis)

1. Désactiver le widget dans Grist (retirer l’URL / la page).
2. Révoquer accès GitHub suspects ; republier un build sain.
3. Auditer l’activité Grist (modifications récentes) pour les utilisateurs concernés.
