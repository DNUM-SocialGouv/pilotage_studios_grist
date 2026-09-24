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

Corps = **source unique** [`.github/pull_request_template.md`](../../../.github/pull_request_template.md) — commencer par le bloc **« En clair »** (rule [`pedagogie-non-technique`](../../rules/pedagogie-non-technique.mdc)).

```bash
git push -u origin HEAD

gh pr create --repo DNUM-SocialGouv/pilotage_studios_grist \
  --title "…" \
  --body "$(cat <<'EOF'
## En clair
…

## Résumé
…

## Test
- [ ] Widget dans Grist (URL Pages stable ou localhost:5175)
- [ ] Accès full + table Plan_activite
- [ ] Navigation MemoryRouter OK

## Documentation
- [ ] `docs/fonctionnel/` à jour ou N/A
- [ ] Matrice rôles (`docs/fonctionnel/roles/matrice-droits.md`) à jour ou N/A
- [ ] Portage app solo : N/A | fiche `docs/portage/`

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

Si la PR livre une **feature / correctif visible** : avant ou juste après merge, skill
**[pilotage-grist-kanban](../pilotage-grist-kanban/SKILL.md)** — proposer
`en_cours` → `livre` (+ guides / `Page_path` si écran livré) ; **HITL** avant écriture.

Checklist : [CHECKLIST.md](CHECKLIST.md). Doc : [../pilotage-grist-issue/DOC-FONCTIONNEL.md](../pilotage-grist-issue/DOC-FONCTIONNEL.md).
