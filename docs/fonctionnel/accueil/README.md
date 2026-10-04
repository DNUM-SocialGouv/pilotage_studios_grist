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
| Accueil par rôle | Salutation « Bonjour » + libellé de rôle + message court + **2–4 CTA** filtrés comme la nav (`Page_*` + flags rôle / département) |
| Freelance | CTA : Mon carnet · Missions · Documentation ; rappel déclarer les jours ; pas de Budget |
| Responsable | CTA : Revue CRA équipe (si département) · Mon carnet · Missions ; hint département ; pas de CTA Weekly générique |
| Admin | CTA : Missions · Bons de commande · Droits des pages · **Feuille de route** |
| Invité | CTA : Missions · Produits · Documentation (si `Page_regles_metier`) ; pas de carnet / revue / droits |
| Profil vide / erreur | Message explicite + CTA limités (Documentation / Missions si ouverts en fail-closed) — **pas** de 5ᵉ rôle inventé |
| Kanban | **Absent** de `/` — voir [`feuille-de-route.md`](feuille-de-route.md) |
| Nav | `WidgetNav` : chrome **Page précédente** · Accueil · modules · **menu compte** (Mon carnet · Feuille de route · Documentation) |
| Layout | Panneau large (`welcome-page__panel--wide`) |
| Fallback | Route `*` → redirection vers `/` |

### Droits / `Page_*`

| Sujet | Choix | Motif |
|-------|-------|--------|
| Route `/` | `Page_accueil` existante (non modifiable Admin) | Pas de nouvelle colonne |
| Variante CTA par rôle | **N/A `Page_*`** — branchement sur `Role` (+ mêmes gardes que la nav) | Variante d’écran, pas nouvel interrupteur |
| Feuille de route dédiée | **Fixé ouvert** sans `Page_*` | Décision porteur — voir [`feuille-de-route.md`](feuille-de-route.md) |

## Données Grist

- Profil session : `Acl_profil` (rôle + `Page_*`) via `useAclProfil` — déjà chargé pour la nav.
- Kanban / commentaires : utilisés sur `/feuille-de-route`, plus sur `/`.
- Pas de nouvelle table ni d’écriture pour l’accueil rôle.

## Hors scope

- Contenu marketing / branding Marianne / hero image
- Tuiles recopiant **toute** la nav
- Tableaux de bord chiffrés (reste BDC, jours CRA, alertes)
- Mini-kanban Admin en plus de la page dédiée
- Redirection auto Freelance → `/cra/declarer`
- Personnalisation éditable dans Grist (CMS d’accueil)
- Drag-and-drop des cartes ; édition texte tickets / commentaires
- Sync automatique GitHub ↔ Grist ; notifications mail
- Features IA / analyse
