# Checklist PR — pilotage_studios_grist

- [ ] Branche ≠ `main` (pas de push direct sur `main`)
- [ ] `npm run lint` + `npm run build` OK
- [ ] Aucune clé API / secret dans le diff
- [ ] MemoryRouter conservé (pas BrowserRouter)
- [ ] Pas de Header Marianne / Footer app ajoutés par erreur
- [ ] Tables Grist documentées dans AGENTS.md si nouvel écran
- [ ] Test manuel iframe Grist listé dans la PR
- [ ] Pages : assets relatifs (`base: "./"`) toujours OK
- [ ] Merge avec `gh pr merge --delete-branch` après CI verte
