# Widget UX selon rôle

## En clair

Le widget **cache des menus** et **refuse des pages** selon les cases `Page_*` de votre fiche `Acl_profil` (elles viennent automatiquement de la table admin `Droits_pages`). C’est du **confort** : ça n’empêche pas de contourner l’interface. La protection réelle des données reste les **Access Rules** Grist (couche 6) — prévues plus tard pour la saisie CRA freelance.

## Statut (2026-09-18)

| Étape | État |
|-------|------|
| User Attribute `Equipe` | **Fait** |
| Pont `Acl_profil` (rôle + `Page_*` ← `Droits_pages`) | **Fait** (Grist) |
| Nav filtrée + gardes de route | **Fait** (widget) |
| Page Admin Droits des pages | **Fait** (`/outils/droits-pages`) |
| Access Rules `Realise` par rôle | **Plus tard** |

Suivi des cellules : [`matrice-droits.md`](matrice-droits.md) tableau **A**.

## Règles produit

- Ne jamais présenter l’UX comme « sécurisé » sans couche 6.
- Toute nouvelle garde de route / filtre nav → **MAJ matrice** (rule `roles-matrice`).
- Pas de deny Admin-only global sur `Realise` tant que la saisie freelance n’est pas tranchée.
- Fail-closed si profil absent / erreur : pas de PA / BDC / CRA / PV / récap ; Accueil / Missions / Produits / Équipe restent ouverts (aligné seed non-Admin).
- Page Admin `/outils/droits-pages` : réservée rôle Admin (lien `adminOnly` + `AdminRoleGuard`) — hors `Page_*`.

## Technique widget

- Lecture `Acl_profil` **après** boot PA (`useGristPa` + `fetchAllowlistedTable` via `useAclProfilData` / `AclProfilProvider`) — retries si fetch précoce ; `refresh()` après update `Droits_pages`
- Si aucune ligne visible : **création auto** (`createOwnAclProfilRecord` — `E_mail` = compte connecté via jeton session) puis relecture ; ACL serveur `+CR` soi obligatoire
- Si plusieurs lignes pour le même e-mail : le widget garde la **plus ancienne** (id minimal) ; nettoyer les doublons à la main dans Grist
- **Limite test** : « Voir comme » en **lecture seule** bloque la création auto (écritures interdites). Pour valider le create : vrai compte utilisateur, ou provisionner la fiche en Owner puis « Voir comme » pour la lecture / menus
- Pendant `loading` profil : **nav complète hors liens Admin** (pas de flash fail-closed ni flash lien Droits) ; gardes affichent « Vérification… »
- Si profil `empty` / `error` (create ou lecture en échec) : alerte sous la nav + fail-closed budget
- Filtre `WIDGET_NAV_ITEMS` : `filterNavItemsByPageAccess` + `canAccessHref` + option `isAdmin` (liens `adminOnly`)
- Garde pages : `PageAccessGuard` sur les routes mappées (refus → `/`) ; `AdminRoleGuard` pour `/outils/droits-pages`
- Helpers purs : `src/security/pageAccess.ts` ; thématiques Admin : `src/utils/droitsPagesThemes.ts`
- `Droits_pages` : lecture + **update** allowlistés (Owner / `Role_ACL` Admin côté ACL Grist)
- `useAclProfil` hors provider → **throw** (comme `useGristPa`)
