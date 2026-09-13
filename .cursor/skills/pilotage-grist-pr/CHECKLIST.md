# Checklist PR — pilotage_studios_grist

- [ ] Branche ≠ `main` (pas de push direct sur `main`)
- [ ] `npm run lint` + `npm run build` OK (`lint` = `tsc --noEmit`)
- [ ] Aucune clé API / secret dans le diff
- [ ] MemoryRouter conservé (pas BrowserRouter)
- [ ] Pas de Header Marianne / Footer app ajoutés par erreur
- [ ] `getEmbedTrust` / pas de `grist.ready` si untrusted
- [ ] `fetchTable` uniquement via `fetchAllowlistedTable` (pas d’ID libre)
- [ ] Tables documentées dans `AGENTS.md` §4 si nouvel écran / nouvelle table
- [ ] Doc fonctionnelle : `docs/fonctionnel/` MAJ ou **N/A** justifié ([DOC-FONCTIONNEL.md](../pilotage-grist-issue/DOC-FONCTIONNEL.md))
- [ ] Portage app solo : **N/A** | fiche créée sous `docs/portage/` ([template](../../docs/portage/_TEMPLATE.md))
- [ ] Si roadmap / issue publique : libellés métier OK ([issues-publiques.md](../../docs/issues-publiques.md)) ; pas de nominatif
- [ ] Simplification challengée (rien d’ajouté « au cas où »)
- [ ] Régression PA + BDC listée si touché (liste / fiche / liens croisés)
- [ ] Test manuel iframe Grist listé dans la PR
- [ ] Pages : assets relatifs (`base: "./"`) toujours OK
- [ ] Merge avec `gh pr merge --delete-branch` après CI verte
