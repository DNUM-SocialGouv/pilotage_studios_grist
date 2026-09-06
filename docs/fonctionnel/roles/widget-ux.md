# Widget UX selon rôle — différé

## Décision

L’adaptation du Custom Widget (masquer nav / écrans selon `Role`) est **hors scope immédiat**, conformément à la feuille de route rôles.

Raison : le contrôle d’accès réel doit d’abord être dans les **Access Rules Grist**. Une UX widget sans ACL = fausse sécurité (le JS reste contournable ; `fetchTable` / REST respectent les ACL serveur).

## Quand le reprendre

Après :

1. User Attributes `user.Email` → `Equipe` opérationnels
2. Matrice de droits appliquée et testée View As
3. Revue sécu ([SECURITY.md](../../../SECURITY.md)) si `Equipe` entre dans `FETCH_TABLE_ALLOWLIST`

## Piste technique (non implémentée)

- Lire le profil via plugin API / table allowlistée `Equipe` filtrée par email session (si exposé)
- Adapter `WIDGET_NAV_LINKS` selon `Role`
- Ne jamais se fier uniquement au masquage UI pour les données sensibles (TJM, budgets)

## Statut todo

**Différé / documenté** — pas de code widget dans cette itération.
