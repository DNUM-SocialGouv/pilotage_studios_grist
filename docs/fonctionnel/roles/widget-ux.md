# Widget UX selon rôle

## En clair

Le widget **cache des menus** et **refuse des pages** selon les cases `Page_*` de votre fiche `Acl_profil` (elles viennent automatiquement de la table admin `Droits_pages`). C’est du **confort** : ça n’empêche pas de contourner l’interface. La protection réelle des données reste les **Access Rules** Grist (couche 6) — prévues plus tard pour la saisie CRA freelance.

## Statut (2026-09-18)

| Étape | État |
|-------|------|
| User Attribute `Equipe` | **Fait** |
| Pont `Acl_profil` (rôle + `Page_*` ← `Droits_pages`) | **Fait** (Grist) |
| Nav filtrée + gardes de route | **Fait** (widget) |
| Access Rules `Realise` par rôle | **Plus tard** |

Suivi des cellules : [`matrice-droits.md`](matrice-droits.md) tableau **A**.

## Règles produit

- Ne jamais présenter l’UX comme « sécurisé » sans couche 6.
- Toute nouvelle garde de route / filtre nav → **MAJ matrice** (rule `roles-matrice`).
- Pas de deny Admin-only global sur `Realise` tant que la saisie freelance n’est pas tranchée.
- Fail-closed si profil absent / erreur : pas de PA / BDC / CRA / PV / récap ; Accueil / Missions / Produits / Intervenants restent ouverts (aligné seed non-Admin).

## Technique widget

- Lecture `Acl_profil` **après** boot PA (`useGristPa` + `fetchAllowlistedTable` via `useAclProfilData` / `AclProfilProvider`) — retries si fetch précoce
- Pendant `loading` profil : **nav complète** (pas de flash fail-closed) ; gardes affichent « Vérification… »
- Si profil `empty` / `error` : alerte sous la nav + fail-closed budget
- Filtre `WIDGET_NAV_ITEMS` : `filterNavItemsByPageAccess` + `canAccessHref` (une fois le profil résolu)
- Garde : `PageAccessGuard` sur les routes mappées (refus → `/`)
- Helpers purs : `src/security/pageAccess.ts`
- `Droits_pages` **hors** allowlist (Owner / `Role_ACL` Admin seulement)
- `useAclProfil` hors provider → **throw** (comme `useGristPa`)
