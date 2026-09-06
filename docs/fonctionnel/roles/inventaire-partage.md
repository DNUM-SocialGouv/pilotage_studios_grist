# Inventaire partage — document Pilotage studio (V2)

**Repo public** : ce fichier ne contient **aucune** donnée nominative (noms, emails).

Listes détaillées (prénoms, emails) : dossier local gitignoré  
`docs/fonctionnel/roles/private/` (ex. `inventaire-partage-nominatif.md`) — absent du dépôt GitHub.  
Suppression en fin de chantier : `rm -rf docs/fonctionnel/roles/private`.

## Comment regenerer l’inventaire nominatif

Via le **MCP Grist local** (`grist-mcp-server`, hors de ce dépôt) :

```text
grist_list_doc_access(docId)
grist_access_gap_report(docId)
```

Écrire le résultat sous `docs/fonctionnel/roles/private/` (déjà dans `.gitignore`).  
Ne jamais coller emails / noms dans une PR ni dans les docs versionnées.

## Synthèse anonymisée (indicatif — snapshot 2026-09-06, à rafraîchir via MCP)

| Indicateur | Valeur |
|------------|--------|
| `maxInheritedRole` | `viewers` |
| Owners (effectif = `access` ou `parentAccess`) | **12** |
| Editors | **6** |
| Viewers | **19** |
| Total comptes sur le partage | **37** |
| Lignes `Equipe` avec email | **33** |
| Actifs `Equipe` **sans** email | **15** |
| Invités **hors** `Equipe` (email non trouvé dans la table) | **22** |
| Emails `Equipe` **non invités** sur le doc | **18** |

Niveau effectif = `access` document si non null, sinon `parentAccess` (héritage workspace/org).

## Domaines email observés (agrégats, pas d’adresses)

Présents dans `Equipe.E_mail` et/ou sur le partage :

- `sg.social.gouv.fr`
- `externes.sg.social.gouv.fr`
- `beta.gouv.fr`
- `prestataire.modernisation.gouv.fr`
- boîtes personnelles (ex. gmail) — à éviter pour le matching ACL

## Écarts types (actions Owner, sans nominatif)

1. **Actifs sans `E_mail`** — bloquent User Attributes ; compléter ou passer Inactif.
2. **Alias / double email** — l’email de connexion Grist doit être **identique** à `Equipe.E_mail` (ex. compte `@beta…` vs ligne `@externes…`, ou boîte perso vs pro).
3. **Lignes `Equipe` non invitées** — décider invitation Viewer/Editor ou pas d’accès document.
4. **Invités hors `Equipe`** — les ajouter dans `Equipe` (avec `Role`) ou tenir une table `Utilisateurs_ACL` séparée.

Répartition indicative des Actifs sans email (comptages par département `Equipe`) : Access. 5 · Design 1 · Product 1 · RU 3 · Tech 5.

Détail nominatif : fichier local sous `docs/fonctionnel/roles/private/` (non versionné).

## MCP

Outils utiles du serveur **local** `grist-mcp-server` (pas le bundle widget, pas ce repo) :

- `grist_list_doc_access`
- `grist_users_for_view_as`
- `grist_get_acl_rules`
- `grist_access_gap_report`
- `grist_access_rules_reference`

Recharger le serveur MCP Cursor après `npm run build` dans `grist-mcp-server`.
