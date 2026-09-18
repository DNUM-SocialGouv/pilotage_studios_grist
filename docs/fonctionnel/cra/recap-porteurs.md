# Récap porteurs

[← CRA](README.md) › **Récap porteurs**

> **Route** : `/outils/recap-porteurs`  
> **Nav** : Outils → Récap porteurs  
> **Issue** : [#48](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48)

## Objet

Une fois les CRA d’une période saisis, **générer un récap par porteur** (`Equipe.Portage` : MALT, OCTO, Opteamis, etc.) pour l’envoyer manuellement — jours affectés, n° Chorus, bon de commande.

Pas d’envoi mail automatique : le widget prépare le contenu (CSV / copie HTML ou Markdown) ; l’envoi se fait depuis la messagerie.

## Accès

Menu **Outils → Récap porteurs** (page dédiée, pas de drawer). Pas de bouton sur la liste `/cra`.

## Filtres

| Filtre | Comportement |
|--------|--------------|
| **Mois du récap** | Obligatoire. Prérempli avec le mois le plus récent (resynchronisé si hors options). **Réinitialise** équipe, portage et filtres avancés. |
| **Équipe** | Filtre local. **Réinitialise** portage et filtres avancés. |
| **Portage** | Filtre l’aperçu **et** les actions globales (compteur, Copier tout, CSV). |
| **Avancés** | BDC, intervenant, produit (accordéon) — locaux à la page. |

## Aperçu

Accordion **par portage** (libellé : portage · nb lignes · total jours · total TTC).  
Intervenants sans `Portage` → groupe **« Sans portage »**.

## Colonnes

Accordion **« Colonnes affichées et exportées »** (replié par défaut). La sélection s’applique à l’aperçu, au CSV et à la copie.

| Par défaut (envoi porteur) | Optionnelles (interne) |
|----------------------------|-------------------------|
| Portage, Intervenant, N° Chorus, Bon de commande, Jours, TTC | Période, Produit, Mission, Équipe |

N° Chorus = `BDC.BdC_Chorus` ; nom BDC = `Nom_BdC`.

## Actions

| Action | Effet |
|--------|--------|
| **Télécharger CSV par porteur** | Un fichier CSV par portage visible (`;` + BOM UTF-8) |
| **CSV consolidé** | Un fichier pour les lignes visibles |
| **Format de copie** | **HTML** (défaut, Outlook) ou **Markdown** |
| **Copier tout** / **Copier** | Presse-papiers selon le format choisi |

## Données

Mêmes tables lazy que `/cra` via `useMissionsData` + `BDC` du contexte PA. Groupement via `Equipe.Portage` (pas de table `Portage_Projet`).

## Limites

- Pas d’envoi mail depuis le widget
- Tâches réalisées non exportées
- Pas de rapprochement Malt
- Lecture seule (pas de create / edit CRA — [#33](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33))
- Aperçu par portage **sans pagination** (exception DSFR) : l’export / la copie portent toutes les lignes du groupe
- Si la table `Equipe` est indisponible : **export et copie bloqués** (évite un récap entièrement « Sans portage »)
- Changer de mois (ou d’équipe) réinitialise les autres filtres
