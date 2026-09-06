# Pilotage studios — Custom Widget Grist

Interface DSFR embarquée dans [Grist](https://grist.numerique.gouv.fr) (document pilotage V2).  
Repo : [DNUM-SocialGouv/pilotage_studios_grist](https://github.com/DNUM-SocialGouv/pilotage_studios_grist)  
App sœur (hors iframe) : [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios)

## Sécurité (lire en premier)

L’URL GitHub Pages est **publique** (le code JS est téléchargeable). Cela **n’ouvre pas** le document Grist à Internet.

Les données ne sont accessibles que via le canal widget **pour un utilisateur déjà connecté à Grist**, avec le niveau d’accès qu’il a accordé.

Détail et garde-fous : **[SECURITY.md](SECURITY.md)**.

## Brancher dans Grist

1. `npm ci && npm run dev` → `http://localhost:5175` (test)  
   ou URL Pages (ajoutez un cache-bust après déploiement) :  
   `https://dnum-socialgouv.github.io/pilotage_studios_grist/?v=4`
2. Widget **Custom** → **URL personnalisée**
3. Accès **full** (lecture tables liées)
4. Select Data = `Plan_activite`

## Dev

```bash
npm ci
npm run dev      # :5175
npm run build
npm run lint
```

## V1

- Navigation (sans Header/Footer) + **PA** liste/fiche
- Autres entrées de nav = stubs (Analyse IA = hors scope widget)
