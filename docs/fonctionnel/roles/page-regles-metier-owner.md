# Owner UI — colonne `Page_regles_metier`

[← Rôles & droits](README.md) › **Page_regles_metier (Owner)**

## En clair

Pour que les Admin puissent activer ou désactiver le **guide Règles métier** rôle par rôle, il faut ajouter une colonne dans Grist. **Seul le Owner** du document doit le faire dans l’interface Grist. Les agents **ne modifient pas** les Access Rules (ACL) via API.

**Statut** : OK Owner pour créer (HITL 2026-10-03) · **colonne à poser manuellement** (MCP Cloud absent / pas de mutation ACL API).

## Étapes Owner (UI Grist)

Document : Pilotage studio V2 (`nei9DeARs5Eo`).

### 1. Table `Droits_pages` — nouvelle colonne

1. Ouvrir la table **Droits_pages**.
2. Ajouter une colonne **`Page_regles_metier`**.
3. Type : **Toggle** (booléen), comme les autres `Page_*`.
4. Valeurs par défaut pour **toutes les lignes de rôle** (Admin, Responsable de département, Freelance, Invité) : **oui** / `true`.

### 2. Table `Acl_profil` — formule miroir

1. Ouvrir la table **Acl_profil**.
2. Ajouter une colonne **`Page_regles_metier`**.
3. Type : formule (même modèle que les autres `Page_*` existants), pointant vers la case correspondante de `Droits_pages` pour le rôle de la fiche.

Formule cible (à aligner sur le pattern déjà en place pour `Page_missions`, `Page_recap_porteurs`, etc.) :

```text
LOOKUPONE(Droits_pages, Role=$Role).Page_regles_metier
```

Si les autres `Page_*` utilisent une variante (référence Role, autre LOOKUP), **reproduire exactement le même pattern** — ne pas inventer une nouvelle syntaxe.

### 3. Vérifications

| Contrôle | Attendu |
|----------|---------|
| 4 lignes `Droits_pages` | `Page_regles_metier` = oui |
| Fiche `Acl_profil` d’un Freelance | `Page_regles_metier` = oui (formule) |
| Widget → Outils | Lien **Règles métier** visible |
| Admin → Droits des pages → Outils | Interrupteur **Règles métier** éditable |
| Couper Invité à non | Lien masqué pour Invité après refresh profil |

### 4. Ne pas faire

- **Ne pas** modifier les Access Rules / ACL via API ou MCP.
- **Ne pas** rendre « Droits des pages » configurable via un `Page_*`.
- **Ne pas** laisser la colonne à `false` pour tous les rôles (le guide doit être lisible par l’équipe).

## Fallback widget sans colonne

Tant que la colonne n’existe pas encore sur `Acl_profil`, le widget garde le guide **ouvert** (fail-closed = oui pour `Page_regles_metier`) afin de ne pas bloquer la lecture pédagogique.
