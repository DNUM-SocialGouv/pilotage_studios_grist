# Pilotage studios — Custom Widget Grist

Interface DSFR embarquée dans [Grist](https://grist.numerique.gouv.fr) (document pilotage V2).  
Repo : [DNUM-SocialGouv/pilotage_studios_grist](https://github.com/DNUM-SocialGouv/pilotage_studios_grist)  
App sœur (hors iframe) : [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios)

## Sécurité (lire en premier)

L’URL GitHub Pages est **publique** (le code JS est téléchargeable). Cela **n’ouvre pas** le document Grist à Internet.

Les données ne sont accessibles que via le canal widget **pour un utilisateur déjà connecté à Grist**, avec le niveau d’accès qu’il a accordé.

Détail et garde-fous : **[SECURITY.md](SECURITY.md)**.

Documentation :

- Technique agents : **[AGENTS.md](AGENTS.md)**
- Parcours métier (PA, BDC) : **[docs/README.md](docs/README.md)**

## Brancher dans Grist

1. `npm ci && npm run dev` → `http://localhost:5175` (test)  
   ou URL Pages (stable, sans `?v=`) :  
   `https://dnum-socialgouv.github.io/pilotage_studios_grist/`  
   Après un déploiement, un auto-bust (`version.json`) recharge l’iframe si le cache est périmé.
2. Widget **Custom** → **URL personnalisée**
3. Accès **full** (lecture tables liées via `docApi.fetchTable`)
4. Select Data = `Plan_activite` (**table ancre** — à ne pas changer pour les autres pages)

**Une seule iframe = toute l’app.** La nav interne (`MemoryRouter` : PA, BDC, Produits…) ne nécessite **pas** de reconfigurer Select Data ni d’ajouter un widget par écran. `onRecords` suit l’ancre PA ; les autres tables passent par `fetchTable` (allowlist dans le code).

## Dev

```bash
npm ci
npm run dev      # :5175
npm run build
npm run lint
```

## V1

- Navigation (sans Header/Footer) + **PA**, **BDC**, **Missions** (liste + fiche) + feedback
- Accueil : kanban Grist (`Kanban`) + conversation dans le drawer (`Kanban_commentaires`) — lien GitHub optionnel ; Admin change la colonne
- Doc parcours : [docs/](docs/README.md) · **Grist-first** : voir [AGENTS.md](AGENTS.md) §2
- Prochaine priorité métier : [prestations #31](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31) (pas Produits en premier)
