# Guide des règles métier (widget)

[← Documentation](../../README.md) › **Règles métier**

> **Routes** : `/outils/regles-metier` (+ sous-pages)  
> **Entrée** : menu compte → **Documentation** (libellé) — plus sous Outils  
> **Accès** : interrupteur `Page_regles_metier` — **oui** pour les 4 rôles (Invité activé HITL porteur 2026-10-04)

## En clair

Un **petit guide produit** dans le widget : cinq pages courtes qui expliquent les règles de base du Pilotage (missions, prestations, CRA, bons de commande, plans d’activité, rôles). Ton métier, schémas illustrés, **aucun** code ni chemin de fichier dans le contenu affiché aux utilisateurs.

## Parcours

| Page | Route | Contenu |
|------|-------|---------|
| Accueil du guide | `/outils/regles-metier` | Pourquoi ce guide + amorces Freelance / responsable + vue d’ensemble + appel feedback |
| Missions & prestations | `/outils/regles-metier/missions` | Mission = lot ; prestation = qui intervient (personne × métier × période) ; édition Admin |
| CRA / réalisations | `/outils/regles-metier/cra` | Réalisation = personne × prestation × mois ; déclaration → revue → rattachement BDC |
| BDC & PA | `/outils/regles-metier/bdc-pa` | PA enveloppe → BDC engage → CRA consomme |
| Qui voit quoi | `/outils/regles-metier/qui-voit-quoi` | Rôles en langage métier + encadrés Admin |

Layout : sommaire + contenu (DSFR), fil d’Ariane, liens **Précédent / Suivant**, navigation clavier.

## Droits

| Élément | Détail |
|---------|--------|
| Flag | `Page_regles_metier` (`Droits_pages` + formule `Acl_profil`) |
| Défaut métier | **oui** pour Admin, Resp., Freelance, Invité |
| Fail-closed widget | **ouvert** si colonne absente / profil incomplet (guide pédagogique) |
| Colonne Grist | Posée (Owner UI) — voir [checklist Owner](../roles/page-regles-metier-owner.md) |

## Relation avec `docs/fonctionnel/`

| Doc | Public | Contenu |
|-----|--------|---------|
| **Ce guide (widget)** | Équipe métier | Règles simples, schémas, zéro technique |
| **`docs/fonctionnel/<module>/`** | Contributeurs / agents | Parcours écrans, tables, routes, allowlists |

Les deux se complètent : une évolution de règle visible doit mettre à jour **le guide** *et/ou* la doc contributeurs selon l’impact.

## Hors scope V1

- Feature TJM ([#86](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/86))
- Weekly, Produits détaillés, PV, Évaluations, Analyse dans le guide
- Éditeur CMS / sync Git → pages
- Remplacer la doc agents
