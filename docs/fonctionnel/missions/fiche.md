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
| Retour | Fil d’Ariane : Accueil › Missions › nom de la mission |

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
| **Contexte** | Champs narratifs (demande, enjeux, historique, utilisateurs / périmètre, liens FIGMA/Notion) : titres `#`–`######`, paragraphes, listes `*` / `-`, gras `**…**`, liens Markdown `[libellé](https://…)` |
| **Équipe & prestations** | Filtres **équipe** + **période CRA** (Du mois / Au mois, bornes inclusives sur `Realise.Periode`) + **barre empilée** % TTC par équipe (montant affiché `… € TTC · … jours`, sans titre « TTC par équipe ») ; CTA **Ajouter une prestation** ; tableau prestations avec **CRA dépliables** (chevron si ≥1 CRA dans la plage, sinon spacer ; sous-lignes période / tâches / jours / TTC) — colonnes : **Prestation**, **Statut** (badge), intervenant, équipe, **date de début**, **jours envisagés**, Nb CRA, TTC CRA, action **Modifier**. Si une borne période est active : seules les prestations avec ≥1 CRA dans la plage apparaissent. Composant partagé avec la fiche produit (`MissionEquipePrestationsPanel`). |
| **Note & pièces jointes** | `Suivi_resp_studio` (même formatage Markdown léger) + téléchargement `Docs` avec **nom de fichier** affiché (`GristAttachmentDownloadLink`) — pas d’ajout / suppression |

Les CRA sont consultés via les lignes dépliables de l’onglet Équipe (plus d’onglet Réalisations dédié).
