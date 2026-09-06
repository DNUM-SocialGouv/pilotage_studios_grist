# Documentation fonctionnelle — Custom Widget Grist

Documentation **métier** du widget (parcours, règles, données Grist, limites). Complète [`AGENTS.md`](../AGENTS.md) (référence **technique**) et [`SECURITY.md`](../SECURITY.md).

App sœur (hors iframe) : [pilotage_studios](https://github.com/DNUM-SocialGouv/pilotage_studios) — doc complète sous `docs/fonctionnel/` de ce dépôt.

## Public visé

| Lecteur | Usage |
|---------|--------|
| Studio Tech | Comprendre PA / BDC dans l’iframe |
| Contributeurs / agents | Cadrer une évolution avant issue / PR |

## Sommaire

| Module | Documentation | Statut |
|--------|---------------|--------|
| **Accueil** | [fonctionnel/accueil/](fonctionnel/accueil/) | Documenté (entrée `/`) |
| **Plan d’activité** | [fonctionnel/pa/](fonctionnel/pa/) — [liste](fonctionnel/pa/liste.md) · [fiche](fonctionnel/pa/fiche.md) | Documenté |
| **Bons de commande** | [fonctionnel/bdc/](fonctionnel/bdc/) — [liste](fonctionnel/bdc/liste.md) · [fiche](fonctionnel/bdc/fiche.md) | Documenté |
| Produits, Missions, Intervenants, CRA, PV | — | Stub « À venir » (nav) |
| Évaluations, Analyse | — | Stub hors nav |

## Organisation des fichiers

| Fichier | Rôle |
|---------|------|
| `README.md` (module) | Socle : objet métier, tables, écarts vs app |
| `<parcours>.md` | Un écran / route |

## Conventions

- Décrire le **comportement actuel** du widget, pas la cible future.
- Distinguer **lecture iframe** vs **saisie / import** (réservés à Grist ou à l’app).
- Référencer routes MemoryRouter et `tableId` Grist.
- Même PR que le code pour tout changement de parcours (protocole : [`.cursor/skills/pilotage-grist-issue/DOC-FONCTIONNEL.md`](../.cursor/skills/pilotage-grist-issue/DOC-FONCTIONNEL.md)).

## Maintenance

| Événement | Action |
|-----------|--------|
| Nouveau module livré | Créer `docs/fonctionnel/<module>/` + ligne au sommaire |
| Changement de parcours | Mettre à jour le fichier concerné |
| Nouvelle table branchée | Cohérence avec `AGENTS.md` §4 et `fetchTableAllowlist.ts` |
