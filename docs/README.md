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
| **Accueil** | [fonctionnel/accueil/](fonctionnel/accueil/) | Documenté (entrée `/` + feuille de route) |
| **Plan d’activité** | [fonctionnel/pa/](fonctionnel/pa/) — [liste](fonctionnel/pa/liste.md) · [fiche](fonctionnel/pa/fiche.md) | Documenté |
| **Bons de commande** | [fonctionnel/bdc/](fonctionnel/bdc/) — [liste](fonctionnel/bdc/liste.md) · [fiche](fonctionnel/bdc/fiche.md) | Documenté |
| **Missions** | [fonctionnel/missions/](fonctionnel/missions/) — [liste](fonctionnel/missions/liste.md) · [fiche](fonctionnel/missions/fiche.md) | Documenté (lecture + drawer master ; CRUD prestations = [#31](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31)) |
| **CRA** | [fonctionnel/cra/](fonctionnel/cra/) — [liste](fonctionnel/cra/liste.md) | Documenté (lecture `/cra` ; [#32](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32)) |
| **Feedback** | [fonctionnel/feedback/](fonctionnel/feedback/) — [alertes](fonctionnel/feedback/alertes.md) | Documenté (bouton → `Retours` ; alertes = fallback / webhook HITL) |
| **Rôles & droits Grist** | [fonctionnel/roles/](fonctionnel/roles/) — [inventaire](fonctionnel/roles/inventaire-partage.md) · [matrice](fonctionnel/roles/matrice-droits.md) · [ACL](fonctionnel/roles/access-rules.md) | Inventaire + brouillon HITL ; prep [#47](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47) |
| **Issues publiques** | [issues-publiques.md](issues-publiques.md) | Template rédaction (repo public) |
| **Portage → app sœur** | [portage/](portage/) | Opt-in handoff agents |
| Produits, Intervenants, PV | — | Stub « À venir » (nav) — ordre : voir AGENTS §2 |
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
