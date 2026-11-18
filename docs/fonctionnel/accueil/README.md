# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu rôle** : `src/utils/welcomeHomeByRole.ts` + `WelcomeRoleHome`  
> **Feuille de route** (kanban) : route dédiée [`feuille-de-route.md`](feuille-de-route.md) — `/feuille-de-route`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : un **accueil léger selon le rôle** (Freelance, Responsable de département, Admin, Invité) avec barre de recherche (sauf Invité), **Assistant Pilotage** (chat lecture seule) et bloc **« Vos retours »**. Composition : bandeau recherche pleine largeur ; sur grand écran **assistant | Vos retours** ; sur mobile empilement (retours puis assistant). Les écrans métier restent dans la **nav** et le **menu compte** (plus de tuiles CTA sur `/`). La **feuille de route** s’ouvre depuis le menu compte ou le lien du bloc retours.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Accueil par rôle | Salutation + (selon rôle) libellé / message court ; **pas** de colonne de raccourcis CTA (remplacée par l’assistant) |
| Freelance | Titre **« Bonjour [Prénom] »** ; bandeau recherche ; « À savoir » = rappel déclarer les jours ; écrans via nav / menu compte |
| Responsable | Titre **« Bonjour [Prénom] »** ; bandeau recherche ; écrans via nav / menu compte |
| Admin | Titre **« Bonjour [Prénom] »** ; bandeau recherche ; Feuille de route via **menu compte** (plus de CTA accueil) |
| Invité | « Pilotage studios » + « Bonjour » + libellé rôle ; **pas** de barre de recherche ; **oui** Vos retours si e-mail OK ; assistant visible |
| Profil vide / erreur | Message explicite ; **pas** de barre de recherche ; **pas** de Vos retours |
| **Assistant** | Panneau intégré (`AssistantChatPanel` embedded) : questions par **nom** de mission ; faits CRA côté widget ; config URL/jeton en session ; **N/A `Page_*`**. Hors `/` : FAB + tiroir |
| Recherche d’accueil | Bandeau pleine largeur ; suggestions → fiches produit / mission / personne ; cibles filtrées par `Page_*` ; pas Invité |
| **Vos retours** | Cartes Feedback de l’auteur session ; Actifs / Archivés ; lien feuille de route ; drawer ticket |
| Kanban complet | **Absent** de `/` — voir [`feuille-de-route.md`](feuille-de-route.md) |
| Nav | `WidgetNav` : chrome **Page précédente** · Accueil · modules · **menu compte** |
| Layout | Panneau large ; split desktop assistant \| retours |
| Fallback | Route `*` → redirection vers `/` |

### Droits / `Page_*`

| Sujet | Choix | Motif |
|-------|-------|--------|
| Route `/` | `Page_accueil` existante (non modifiable Admin) | Pas de nouvelle colonne |
| Assistant sur `/` (+ FAB ailleurs) | **N/A `Page_*`** — comme le feedback flottant | Essai lecture seule ; restreindre plus tard (#145) |
| Anciens CTA par rôle | **Non rendus** — catalogue encore calculé dans `welcomeHomeByRole` (tests) ; écrans via nav / menu compte | Simplification accueil (#140) |
| Barre de recherche sur `/` | **N/A `Page_*`** — variante selon `Role` ; cibles filtrées par `Page_produits` / `Page_missions` / `Page_equipe` | Pas de route `/recherche` |
| Bloc « Vos retours » | **N/A `Page_*`** — variante sur `/` ; Invité inclus si e-mail OK | Pas de route `/mes-retours` |
| Feuille de route dédiée | **Fixé ouvert** sans `Page_*` | Voir [`feuille-de-route.md`](feuille-de-route.md) |

## Données Grist

- Profil session : `Acl_profil` (rôle + `Page_*`) via `useAclProfil` — déjà chargé pour la nav.
- Prénom accueil Freelance / Admin / Resp. : `Equipe.Prenom_Nom` résolu avec l’e-mail de session (`displayName` dans `useAclProfil`, déjà utilisé pour le menu compte) — **pas** de clé API ni d’appel REST dédié.
- Recherche d’accueil (lazy, lecture) : `Tableau_de_pilotage_SDPC_Produits_SDPC`, `Missions`, `Equipe` via `fetchAllowlistedTable` — tables déjà allowlistées ; **pas** de nouvelle table ni d’écriture.
- Vos retours (lazy, lecture) : `Kanban` + `Kanban_commentaires` via `fetchAllowlistedTable` — déjà allowlistées ; filtre UX par e-mail session ; **pas** d’écriture pour le marqueur « lu » (localStorage).
- Kanban complet / commentaires drawer : aussi sur `/feuille-de-route`.
- Pas d’écriture pour l’accueil rôle (hors FAB feedback global).

## Hors scope

- Contenu marketing / branding Marianne / hero image
- Tuiles recopiant **toute** la nav
- Tableaux de bord chiffrés (reste BDC, jours CRA, alertes)
- Mini-kanban Admin en plus de la page dédiée
- Colonne Grist lu/non-lu ; route `/mes-retours` ; sync multi-appareils du marqueur « lu »
- Redirection auto Freelance → `/cra/declarer`
- Personnalisation éditable dans Grist (CMS d’accueil)
- Drag-and-drop des cartes ; édition commentaires (corps Résumé/Détail Admin = feuille de route)
- Sync automatique GitHub ↔ Grist ; notifications mail
- Analyse page `/analyse` (l’assistant essai est sur `/` / FAB — hors scope marketing)
- Recherche Invité ; cibles BDC / PA / CRA / kanban ; route `/recherche` ; recherche dans `WidgetNav`
