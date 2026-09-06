# Sécurité — Custom Widget Grist

## Ce que l’URL publique expose (et n’expose pas)

| Exposé | Non exposé |
|--------|------------|
| Le **code** JavaScript/CSS du widget (Pages) | Les **données** du document Grist |
| Le fait qu’un widget Pilotage existe | Clés API Grist / LLM (aucune dans le bundle) |

Ouvrir `https://…github.io/pilotage_studios_grist/` **seul** n’affiche aucune ligne métier : pas de session Grist, pas de `postMessage` parent.

Les données n’apparaissent que si :

1. un utilisateur **authentifié** ouvre le document Grist,
2. avec ce widget **embarqué** et un niveau d’accès accordé,
3. via le canal `grist-plugin-api` (droits = ceux de l’utilisateur).

## Menace principale

**Compromission du JS hébergé** (compte GitHub, supply chain npm, Pages) → code malveillant exécuté **chez les collègues** qui ont le widget ouvert → exfiltration / modification via l’accès widget (`full`).

Ce n’est **pas** « tout Internet lit notre Grist » ; c’est « un attaquant qui contrôle l’URL du widget agit avec les droits des utilisateurs Grist qui le chargent ».

## Garde-fous en place (V1)

1. **Aucun secret** dans le dépôt / bundle (`VITE_GRIST_API_KEY`, clés LLM interdits).
2. **Contrôle d’embed** (`src/security/embedTrust.ts`) : refuse `grist.ready` si l’iframe a un parent non Grist.
3. **Allowlist** des `fetchTable` (`src/security/fetchTableAllowlist.ts` — pas d’ID de table libre côté UI).
4. **Lecture seule métier** V1 : pas d’API d’écriture dans les hooks.
5. **CSP** injectée au build (meta) + script API depuis `grist.numerique.gouv.fr` (sans `eval` ; `docs.getgrist.com` est en mode eval et casse sous CSP).
6. **Pas de source maps** en production.
7. **Repo** : revue PR / protection de `main` recommandées (org).
8. **Dependabot / `npm audit`** dans la CI Pages.

## Limites GitHub Pages

- Pas de header HTTP `Content-Security-Policy: frame-ancestors …` (meta CSP ne le couvre pas) → le contrôle parent est fait en JS.
- Le JS reste téléchargeable : ne pas y mettre de logique « secrète ».

## Durcissement org recommandé

- Branch protection `main` : PR obligatoire, pas de push direct.
- 2FA sur les comptes avec droit d’écriture.
- Restreindre qui peut modifier le workflow Pages.
- Surveiller les releases / commits sur `main`.

## Si incident (JS compromis)

1. Désactiver le widget dans Grist (retirer l’URL / la page).
2. Révoquer accès GitHub suspects ; republier un build sain.
3. Auditer l’activité Grist (modifications récentes) pour les utilisateurs concernés.
