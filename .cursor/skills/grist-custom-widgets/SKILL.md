---
name: grist-custom-widgets
description: Référence Custom Widgets Grist (plugin API, onRecords, fetchTable, ready). À utiliser quand on crée ou modifie le widget pilotage_studios_grist.
---

# Grist Custom Widgets — notes pour ce dépôt

Adapté de [berhalak/skills/grist-custom-widgets](https://github.com/berhalak/skills/blob/master/grist-custom-widgets/SKILL.md) au contexte **Pilotage studios Grist** (Pages + iframe DINUM).

## Ordre d’init (critique)

```js
grist.onRecords((recs) => { /* … */ });  // 1. s’abonner d’abord
grist.ready({ requiredAccess: 'full' }); // 2. puis ready
// 3. hydrater via docApi.fetchTable si besoin de TOUTES les colonnes
```

**Ne jamais** appeler `ready()` dans `index.html` avant que React ait enregistré `onRecords` — sinon l’événement initial est perdu → écran « Connexion à Grist… » bloqué.

## onRecords vs fetchTable

| API | Colonnes |
|-----|----------|
| `onRecords` | **Uniquement** les champs du *view section* du widget (« Colonnes visibles » dans Grist) |
| `docApi.fetchTable(tableId)` | **Toutes** les colonnes (accès `full`) |

Dans ce projet : hydratation PA via `fetchTable('Plan_activite')` + `onRecords` pour le live.

## Accès

- `none` | `read table` | `full`
- V1 Pilotage : `full` pour BDC / Constatations / Commandes_Sofiane

## Script API

- Préférer **`./grist-plugin-api.js` vendored** (build `grist.numerique.gouv.fr`, sans `eval`)
- Éviter `docs.getgrist.com/...` sous CSP stricte (devtool `eval` → script mort)

## Sécurité

Voir [SECURITY.md](../../../SECURITY.md) : URL Pages publique ≠ données publiques ; pas de secrets dans le bundle.

## Référence amont

Skill complet (écriture, mapping colonnes, theming) :  
https://github.com/berhalak/skills/blob/master/grist-custom-widgets/SKILL.md
