---
name: pilotage-grist-pr
description: Ouvre ou merge une PR pour DNUM-SocialGouv/pilotage_studios_grist. Use when creating or merging a pull request on the Grist widget repo.
---

# Pull request — pilotage_studios_grist

```bash
npm run lint && npm run build
git push -u origin HEAD

gh pr create --repo DNUM-SocialGouv/pilotage_studios_grist \
  --title "…" \
  --body "$(cat <<'EOF'
## Résumé
…

## Test
- [ ] Widget dans Grist (URL Pages ou localhost)
- [ ] Accès full + table Plan_activite
- [ ] Navigation MemoryRouter OK

## Impact
- [ ] UI widget seule
- [ ] Schéma Grist (confirmation explicite requise)
EOF
)"
```

Merge : `gh pr merge --delete-branch` (après revue `pilotage-grist-code-review`).

Checklist : [CHECKLIST.md](CHECKLIST.md).
