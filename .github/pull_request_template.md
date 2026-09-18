## En clair

<!-- Quoi + pourquoi en langage métier, sans jargon ni noms de fichiers -->

## Résumé

<!-- 1–3 phrases : pourquoi ce changement -->

## Studio concerné

- [ ] Studio Produit
- [ ] Studio Tech
- [ ] Les deux / outillage

## Test manuel

- [ ] `npm run lint && npm run build`
- [ ] Widget dans Grist (URL Pages stable ou `http://localhost:5175`)
- [ ] Accès **full** + Select Data = table attendue
- [ ] Navigation MemoryRouter OK

## Impact Grist

- [ ] UI / lecture widget uniquement
- [ ] Écriture ou schéma Grist (confirmation explicite requise)

## Sécurité

- [ ] Aucun secret / clé API dans le diff
- [ ] Pas d’élargissement d’accès API sans revue ([SECURITY.md](SECURITY.md))

## Documentation

- [ ] `docs/fonctionnel/` mis à jour (parcours) ou **N/A**
- [ ] Matrice rôles [`docs/fonctionnel/roles/matrice-droits.md`](../docs/fonctionnel/roles/matrice-droits.md) mise à jour (écrans / données / journal) ou **N/A**
- [ ] `AGENTS.md` / skills mis à jour (ou N/A)
