# Fiche bon de commande — `/bdc/:id`

[← Bons de commande](README.md) › **Fiche**

## Objet

Détail d’un BDC : récap financier (KPI + barre) toujours visible, puis onglets **Dépenses** / **Informations** / **PV**.

## Parcours

| Élément | Détail |
|---------|--------|
| Route | `/bdc/:id` |
| Page | `src/pages/BdcDetailView.tsx` |
| Retour | Lien vers `/bdc` |

## États

| État | UI |
|------|-----|
| Embed non autorisé | Alerte erreur + retour liste |
| Hors Grist | Alerte info + retour liste |
| Chargement connexion | « Connexion à Grist… » |
| Erreur | Alerte erreur + retour liste |
| Accès multi-tables denied / error | Alerte warning (full requis) |
| Chargement BDC | « Chargement du bon de commande… » |
| BDC introuvable | Alerte warning |
| OK | Récap + onglets |

## Récap financier

Sous le titre, **hors onglets**, pattern aligné sur l’app sœur (`BdcFinanceRecap`) :

| Bloc | Source |
|------|--------|
| Budget TTC | `Montant_TTC` |
| Total consommé (CRA) | `Total_TTC_CRA` |
| Solde CRA | `Solde_TTC_CRA` (rouge si négatif) |

Barre « % consommé » vs budget (`Total_TTC_CRA / Montant_TTC`) ; segment plafonné à 100 % en cas de dépassement.

## Onglets

Bloc DSFR `Tabs` sous le récap (défaut : **Dépenses**). Les onglets **Informations** et **PV** restent accessibles si le suivi CRA est indisponible.

### Dépenses (lecture seule)

Lignes `Realise` liées au BDC (`BDC_cible` ou `Bdc_Chorus2`), chargées **uniquement sur la fiche** (`useBdcDepensesData`) — pas au boot widget.

| Élément | Comportement |
|---------|--------------|
| Compteur | Total de lignes du BDC ; si filtre actif, aussi le nombre affiché |
| Camembert « TTC par produit » | Toutes les lignes du BDC (filtres sans effet) — `recharts` lazy |
| Filtres | Période / Intervenant / Produit (grille 2+1) + « Réinitialiser » |
| Tableau | Mission master → prestation → CRA, expansible, **sans pagination 10** (exception ISO documentée) |
| Totaux | Jours + TTC des lignes **filtrées** + TJM moyen (TTC ÷ jours) |
| Vide | « Aucune ligne de suivi mensuel liée à ce BDC. » |
| Filtres sans résultat | « Aucune ligne ne correspond à ces filtres. » |
| Référentiels partiels | Alerte warning + tableau / camembert quand même (regroupement éventuellement incomplet) |

Pas de bouton **Ajouter une dépense**, pas d’actions Dupliquer / Modifier (écriture Grist hors scope V1). Libellés produit en texte (pas de lien `/produits/:id` tant que l’écran Produits n’est pas livré).

Tables : `Realise` (REST `readOnly` + filtre), `Missions`, `Missions_enfants`, `Equipe`, `Tableau_de_pilotage_SDPC_Produits_SDPC`.

### Informations

Grille définition (labels au-dessus des valeurs, 4 colonnes ≥ lg / 2 ≥ sm) :

| Champ | Source |
|-------|--------|
| Financeur | `Financeur` |
| Chorus | `BdC_Chorus` |
| Plan d’activité | `PA` → lien `/pa/:id` |
| Plateforme | `Plateforme` |
| Engagement | `Engagement` |
| Équipe | `Equipe2` (badges couleur) |
| Reste à consommer du PA | calculé si PA lié (écart volontaire vs app sœur) |
| Sofiane | `SOFIANE` — lien externe « Ouvrir dans Sofiane » si URL HTTP(S), sinon texte |
| Devis | `Devis` (Attachments) — `fr-link--download` via `getAccessToken` ; `—` si absent |

Les champs Sofiane / Devis sont chargés via REST (`getAccessToken`) plutôt que seuls via `docApi.fetchTable`.

### PV

Stub : « Les procès-verbaux seront affichés ici une fois l’écran PV livré. »

## Liens croisés

Vers [`/pa/:id`](../pa/fiche.md) quand `BDC.PA` est renseigné.

## Hors scope (cette fiche)

- Drawer création / édition / duplication de lignes `Realise`
- Contenu réel de l’onglet PV
- Upload devis
