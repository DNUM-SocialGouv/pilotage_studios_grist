# Fiche mission — `/missions/:id`

[← Missions](README.md) › **Fiche**

## Objet

Détail d’une mission master : en-tête P2 (bandeau), onglets — aligné UI sur l’app sœur ([PR #222](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/222), [PR #224](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/224), [PR #225](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/225), drawer [#227](https://github.com/DNUM-SocialGouv/pilotage_studios/pull/227)). Édition master via drawer ; CRUD prestations via drawer dédié ; pas d’IA ni d’édition inline contexte / PJ.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/missions/:id` |
| Onglet | Query `?onglet=contexte` \| `equipe` \| `notes` (alias : `note-studio`, `pieces-jointes`, `tab`). Alias legacy `realisations` → **Équipe & prestations** |
| Page | `src/pages/MissionsDetailView.tsx` |
| Retour | Lien vers `/missions` |

## États

Même gate que la liste (`MissionsLayout`). Mission introuvable : alerte warning + retour liste. Pendant un rechargement après création : « Chargement de la mission… » (évite un faux introuvable).

## En-tête (P2)

| Élément | Contenu |
|---------|---------|
| Ligne titre | Badge statut + **H1** (`Nom_de_la_mission`) + bouton **Modifier** (drawer edit) |
| Bandeau méta | 2–3 colonnes bordées : **Produit** (texte) · **Département** (`departement_sdpc` du produit SDPC lié) · **Dernière mise à jour** (masquée si vide). Pas d’intervenants ni de TTC CRA dans l’en-tête |

Pas de CR / estimation / IA.

## Drawer « Modifier » (master)

Champs **Nom · Produit · Statut** uniquement. Prestations : renvoi vers l’onglet **Équipe & prestations** (lien in-drawer). Après enregistrement : Alert succès in-drawer.

## Drawer prestation (onglet Équipe)

| Mode | Champs |
|------|--------|
| **Ajouter** / **Modifier** | **Titre de la prestation** (fallback nom intervenant ; colonne Grist `Titre_de_la_prestation`) · Intervenant (obligatoire) · Jours envisagés (optionnel) · Statut (défaut « En cours ») · Date de début (optionnel) |
| Figé / hors formulaire | `Type_prestation` = `Freelance_jours` à la création seulement ; jamais édité ni affiché ; `Mission_parent` figé ; pas de date de fin ni suppression |

Après succès : Alert in-drawer (edit) ou fermeture (create) + rechargement des données missions.

## Onglets

| Onglet | Contenu |
|--------|---------|
| **Contexte** | Champs narratifs (demande, enjeux, historique, utilisateurs / périmètre, liens FIGMA/Notion) : paragraphes, listes `*` / `-`, gras `**…**`, liens Markdown `[libellé](https://…)` |
| **Équipe & prestations** | Filtre équipe + **barre empilée** % TTC par équipe (total à droite : `TTC · X jours` ; même langage que PA/BDC ; tranche **Hors prestation** si CRA sans enfant) ; CTA **Ajouter une prestation** ; tableau prestations avec **CRA dépliables** (chevron si ≥1 CRA, sinon spacer ; sous-lignes période / tâches / jours / TTC) — colonnes : **titre de la prestation**, intervenant, équipe, **date de début**, **jours envisagés**, Nb CRA, TTC, statut, action **Modifier** |
| **Note & pièces jointes** | `Suivi_resp_studio` (lecture) + téléchargement `Docs` (`GristAttachmentDownloadLink`) — pas d’ajout / suppression |

Les CRA sont consultés via les lignes dépliables de l’onglet Équipe (plus d’onglet Réalisations dédié).
