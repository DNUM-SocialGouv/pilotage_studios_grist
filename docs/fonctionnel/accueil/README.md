# Accueil (welcome)

[← Documentation](../../README.md) › **Accueil**

> **Route** : `/`  
> **Studio** : Tech  
> **Page** : `src/pages/WelcomePage.tsx`  
> **Contenu rôle** : `src/utils/welcomeHomeByRole.ts` + `WelcomeRoleHome`  
> **Feuille de route** (kanban) : route dédiée [`feuille-de-route.md`](feuille-de-route.md) — `/feuille-de-route`

## Objet

Première page affichée à l’ouverture du Custom Widget dans Grist : un **accueil léger selon le rôle** (Freelance, Responsable de département, Admin, Invité) avec quelques boutons utiles. La **feuille de route** (kanban Feedback · Backlog · En cours · Livré) n’est **plus** sur cette page : elle s’ouvre depuis le **menu compte** (avatar en haut à droite). La navigation complète reste dans la **nav** (`WidgetNav`) ; l’accueil ne recopie pas tout le menu.

## Comportement

| Élément | Détail |
|---------|--------|
| Entrée | `MemoryRouter` démarre sur `/` (`initialEntries`) |
| Accueil par rôle | Salutation + (selon rôle) libellé / message court + **2–4 CTA** filtrés comme la nav (`Page_*` + flags rôle / département) |
| Freelance | Titre **« Bonjour [Prénom] »** (`Equipe.Prenom_Nom`, même source que le menu compte ; fallback « Bonjour » si prénom absent) ; **pas** de libellé « Pilotage studios », ni sous-titre rôle, ni phrase d’intro ; **bandeau** (bonjour + barre de recherche produit / mission / personne) ; CTA hors bandeau : Mon carnet · Missions · Documentation ; « À savoir » = rappel déclarer les jours (sans mention Budget) |
| Responsable | Même épurage que Admin : titre **« Bonjour [Prénom] »** ; **pas** de « Pilotage studios », ni sous-titre « Responsable de département », ni phrase d’intro, ni bloc « À savoir » ; **bandeau** recherche ; CTA hors bandeau : Revue CRA équipe (si département) · Mon carnet · Missions ; pas de CTA Weekly générique |
| Admin | Même épurage que Freelance : titre **« Bonjour [Prénom] »** ; **pas** de « Pilotage studios », ni sous-titre « Admin », ni phrase d’intro, ni bloc « À savoir » ; **bandeau** recherche ; CTA hors bandeau : Missions · Bons de commande · Droits des pages · **Feuille de route** |
| Invité | « Pilotage studios » + « Bonjour » + libellé rôle ; CTA : Missions · Produits · Documentation (si `Page_regles_metier`) ; **pas** de bandeau ni de barre de recherche ; pas de carnet / revue / droits |
| Profil vide / erreur | Message explicite + CTA limités (Documentation / Missions si ouverts en fail-closed) — **pas** de 5ᵉ rôle inventé ; **pas** de barre de recherche |
| Recherche d’accueil | **Option A** : « Bonjour [Prénom] » **dans** un bandeau centré (fond DSFR `background-alt-grey` + filet bleu), puis la barre ; CTA **hors** bandeau en dessous ; suggestions inline (≥ 2 lettres) → fiche `/produits/:id`, `/missions/:id` ou `/equipe/:id` ; pas de page `/recherche` ; cibles masquées si `Page_produits` / `Page_missions` / `Page_equipe` fermés ; lazy fetch au premier focus ; pas de hero marketing (pas d’image, pas de slogan) |
| Kanban | **Absent** de `/` — voir [`feuille-de-route.md`](feuille-de-route.md) |
| Nav | `WidgetNav` : chrome **Page précédente** · Accueil · modules · **menu compte** (Mon carnet · Feuille de route · Documentation) |
| Layout | Panneau large (`welcome-page__panel--wide`) |
| Fallback | Route `*` → redirection vers `/` |

### Droits / `Page_*`

| Sujet | Choix | Motif |
|-------|-------|--------|
| Route `/` | `Page_accueil` existante (non modifiable Admin) | Pas de nouvelle colonne |
| Variante CTA par rôle | **N/A `Page_*`** — branchement sur `Role` (+ mêmes gardes que la nav) | Variante d’écran, pas nouvel interrupteur |
| Barre de recherche sur `/` | **N/A `Page_*`** — variante selon `Role` (Admin / Resp. / Freelance) ; cibles filtrées par `Page_produits` / `Page_missions` / `Page_equipe` | Pas de nouvel écran ni route `/recherche` |
| Feuille de route dédiée | **Fixé ouvert** sans `Page_*` | Décision porteur — voir [`feuille-de-route.md`](feuille-de-route.md) |

## Données Grist

- Profil session : `Acl_profil` (rôle + `Page_*`) via `useAclProfil` — déjà chargé pour la nav.
- Prénom accueil Freelance / Admin / Resp. : `Equipe.Prenom_Nom` résolu avec l’e-mail de session (`displayName` dans `useAclProfil`, déjà utilisé pour le menu compte) — **pas** de clé API ni d’appel REST dédié.
- Recherche d’accueil (lazy, lecture) : `Tableau_de_pilotage_SDPC_Produits_SDPC`, `Missions`, `Equipe` via `fetchAllowlistedTable` — tables déjà allowlistées ; **pas** de nouvelle table ni d’écriture.
- Kanban / commentaires : utilisés sur `/feuille-de-route`, plus sur `/`.
- Pas d’écriture pour l’accueil rôle.

## Hors scope

- Contenu marketing / branding Marianne / hero image
- Tuiles recopiant **toute** la nav
- Tableaux de bord chiffrés (reste BDC, jours CRA, alertes)
- Mini-kanban Admin en plus de la page dédiée
- Redirection auto Freelance → `/cra/declarer`
- Personnalisation éditable dans Grist (CMS d’accueil)
- Drag-and-drop des cartes ; édition commentaires (corps Résumé/Détail Admin = feuille de route)
- Sync automatique GitHub ↔ Grist ; notifications mail
- Features IA / analyse
- Recherche Invité ; cibles BDC / PA / CRA / kanban ; route `/recherche` ; recherche dans `WidgetNav`
