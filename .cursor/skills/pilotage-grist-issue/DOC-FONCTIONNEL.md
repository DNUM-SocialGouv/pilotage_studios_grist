# Doc fonctionnelle — avant et après une issue

Référence pour le skill [`pilotage-grist-issue`](SKILL.md). Complète [`docs/README.md`](../../../docs/README.md).

**`AGENTS.md`** = technique (routes, hooks, allowlist) · **`docs/`** = fonctionnel (parcours, règles métier, limites) · **`SECURITY.md`** = menace iframe / secrets.

---

## 1. Avant de coder (si parcours UI)

### 1.1 Lire le sommaire

```text
docs/README.md
```

Repérer si le module est **documenté**, **stub** ou **à documenter**.

### 1.2 Dossier module

| Indices | Dossier `docs/fonctionnel/` |
|---------|----------------------------|
| `/` | `accueil/` |
| `/pa`, `/pa/:id` | `pa/` |
| `/bdc`, `/bdc/:id` | `bdc/` |
| `/produits`… (stubs) | À créer au livrable |
| `/analyse` | N/A — hors scope widget |

Croiser avec **AGENTS.md §2** et `src/pages/`.

### 1.3 Si la doc existe

Lire dans l’ordre : `README.md` du module → fichier(s) parcours. Noter comportement attendu et écarts avec l’issue.

### 1.4 Si la doc n’existe pas

| Type | Action |
|------|--------|
| Feature nouvel écran | Prévoir création doc dans le livrable (§2) |
| Bug sans doc | Lire AGENTS + code ; créer socle minimal si le parcours se stabilise |
| Chore / tech sans impact UI | **N/A** |

### 1.5 Hors scope doc

Refactor interne, CI, skills, typo — sauf si le **parcours utilisateur** change.

---

## 2. Structure nouveau module

```text
docs/fonctionnel/<module>/
├── README.md          # socle
└── <parcours>.md      # un fichier par écran
```

Ajouter une ligne au sommaire [`docs/README.md`](../../../docs/README.md).

---

## 3. Après l’implémentation

| Situation | Action |
|-----------|--------|
| Doc existante + parcours modifié | MAJ README et/ou parcours |
| Doc absente + parcours livré | Créer dossier + sommaire |
| Aucun impact parcours | Indiquer **N/A** dans la PR |

La doc décrit le **comportement après merge**. Inclure `docs/` dans la **même PR** que le code.

---

## 4. Checklist rapide

```text
Avant code :
- [ ] docs/README.md consulté
- [ ] Module identifié (existant ou à créer)
- [ ] Si existant : README + parcours lus

Après code :
- [ ] docs/ alignée avec le comportement livré
- [ ] Sommaire à jour si nouveau module
- [ ] PR : case Documentation cochée ou N/A
```
