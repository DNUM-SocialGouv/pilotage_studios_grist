---
name: pilotage-grist-pr
description: Ouvre ou merge une PR pour DNUM-SocialGouv/pilotage_studios_grist. Use when creating or merging a pull request on the Grist widget repo.
---

# Pull request — pilotage_studios_grist

**`main` est protégée** : pas de push direct. Toute modification passe par une PR.

## 1. Branche

```bash
git checkout main && git pull
git checkout -b feat/<slug>   # ou fix/ chore/ issue-<N>-
```

## 2. Qualité locale

```bash
npm run lint && npm run build
```

## 3. Ouvrir la PR

```bash
git push -u origin HEAD

gh pr create --repo DNUM-SocialGouv/pilotage_studios_grist \
  --title "…" \
  --body "$(cat <<'EOF'
## Résumé
…

## Test
- [ ] Widget dans Grist (URL Pages `?v=` ou localhost:5175)
- [ ] Accès full + table Plan_activite
- [ ] Navigation MemoryRouter OK

## Documentation
- [ ] `docs/fonctionnel/` à jour ou N/A

## Impact
- [ ] UI widget seule
- [ ] Schéma Grist (confirmation explicite requise)
EOF
)"
```

## 4. Merge

Après CI **build** verte (+ revue `pilotage-grist-code-review` si besoin) :

```bash
gh pr merge --delete-branch
```

Checklist : [CHECKLIST.md](CHECKLIST.md). Doc : [../pilotage-grist-issue/DOC-FONCTIONNEL.md](../pilotage-grist-issue/DOC-FONCTIONNEL.md).
