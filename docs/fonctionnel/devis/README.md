# Générer un devis (Outils Admin)

[← Documentation fonctionnelle](../../README.md) › **Générer un devis**

> **Route** : `/outils/generer-devis`  
> **Accès** : Admin uniquement (`adminOnly` + `AdminRoleGuard`) — **hors `Page_*`**  
> Port depuis l’app sœur ([generation-devis.md](https://github.com/DNUM-SocialGouv/pilotage_studios/blob/main/docs/fonctionnel/bdc/generation-devis.md)).

## En clair

Les **Admin** peuvent ouvrir **Outils → Générer un devis** pour rédiger un **texte de devis** à coller vers un **porteur** (groupement d’entreprises du marché 2MAINS Lot 4). On choisit le porteur, on remplit le contexte / les profils / les unités d’œuvre (UO) et les quantités, puis on **copie** le texte (HTML pour Outlook ou Markdown). **Pas de PDF, pas d’IA, pas d’enregistrement dans Grist** : l’humain relit et envoie.

## Qui y accède

| Condition | Effet |
|-----------|--------|
| `Acl_profil.Role` = **Admin** | Lien nav Outils + page accessibles |
| Autre rôle | Lien masqué ; URL refusée (retour Accueil) |
| Preview hors iframe | Page accessible pour développer ; listes Financeur / Équipe vides sans BDC |

Pas de drapeau `Page_*` : même modèle que Spike datatable / Droits des pages (fixé par rôle Admin).

## Parcours (page, 3 étapes)

Toujours **séquentiel** (pas de tiroir large ni d’aperçu côte à côte) :

1. **Porteur** — radios Octo/Malt · Hubvisory/Numércité/Opteamis · IPPON/Inop’s  
2. **Formulaire** — Infos · Génération de la demande · Chiffrage UO + découpe PV  
3. **Aperçu** — HTML ou Markdown + **Copier tout**

## Données

| Source | Usage |
|--------|--------|
| Fichiers `src/data/uo*.ts` + `src/utils/devisPorteurs/*` | Catalogue UO, grilles BPU, templates profils, formatage / copie |
| Table `BDC` (déjà chargée) | Listes **Financeur** et **Équipe** (`collectBdcFinanceurOptions` / `collectBdcEquipeOptions`) — **lecture seule** |

Aucune table « Devis », **aucune écriture** Grist pour ce parcours V1.

## Coefficients IPPON / Inop’s (HT → TTC)

Les prix unitaires **HT** viennent du BPU Excel (fichier « BPU Act » : l’**actualisation** marché ≈ × 1,007 est déjà dans ces HT).

Ce n’est **pas** le markup porteur. Pour **IPPON / Inop’s**, le passage HT → TTC du devis utilise :

| Grandeur | Valeur |
|----------|--------|
| Markup | × 1,05263 (5 % inclus) |
| TVA | × 1,20 |
| Coefficient TTC | × 1,263156 (= markup × TVA) |

Formule : **TTC = HT × 1,05263 × 1,20 = HT × 1,263156**.

Les autres porteurs (Octo/Malt, Hubvisory…) restent sur TTC = HT × TVA dans leur grille BPU (sans ce markup 5 %). L’estimation CRA indicative (`CRA_TTC_MARKUP_FACTOR` 15 %) est un autre parcours (fiche mission) — pas ce coefficient Inops.

## Hors scope V1

- Export PDF / envoi mail
- Appel IA / assistant
- Bouton sur la liste BDC
- Sélecteur de largeur de tiroir / layout split
- Lien obligatoire à une mission Grist

## Fichiers code

| Zone | Fichiers |
|------|----------|
| Page | `src/pages/GenererDevisPage.tsx` |
| Aperçu | `src/components/devis/DevisOpteamisPreview.tsx` |
| Logique | `src/utils/devisPorteurs/*`, `src/data/uo*.ts` |
