# Assistant PARC — essai (questions sur les produits)

## En clair

Une page du widget permet de **poser une question** sur un produit du référentiel **Le PARC** (applications / communs numériques de la sous-direction). La réponse s’appuie sur les **mêmes informations** que dans ce référentiel, en **lecture seule**. Le modèle de langage ne calcule rien et **n’invente pas** : un outil côté serveur prépare d’abord une fiche de faits.

| | |
|--|--|
| **Route widget** | `/assistant-parc` (menu compte — ouverte à tous, hors `Page_*`) |
| **Document Grist** | Le PARC — `vjbmAgqvttQH` |
| **Table principale** | `Produits_DNUM` (~416 produits, ~123 colonnes) |
| **Accès** | Clé API **Viewer** sur le **serveur** d’essai uniquement (jamais dans le navigateur) |

---

## Contrat de faits (qualité)

Même esprit que [contrat-chiffres.md](contrat-chiffres.md) :

> Le modèle **présente** le résultat d’un **outil**. Il **n’invente pas** les valeurs.

| Étape | Qui | Règle |
|-------|-----|--------|
| Matching produit | Serveur | Par **nom** (`Produit`) ou **code** ; ambiguïté → liste de candidats, pas de choix au hasard |
| Fiche | Serveur | **Tous** les champs métier non vides de la ligne, avec **libellés** du glossaire |
| Manquants | Serveur | Liste `missingCritical` (Critique / Important vides) → « non renseigné dans Le PARC » |
| Personnes | Serveur | RefList → noms via `Base_RH.Nom_et_Prenom` |
| Rédaction | LiteLLM | Uniquement à partir des `facts` ; libellés humains, pas ids techniques |

### Sources lues (V0)

| Table | Usage |
|-------|--------|
| `Produits_DNUM` | Fiche produit |
| `Definition_champs_complet` | Libellé, catégorie, priorité |
| `Base_RH` | Résolution des références personnes |
| `Produits_DNUM_parent` | Groupe parent / sous-produits (si lié) |

Hors V0 : FAQ, specs techniques, études d’homologation, Base_RH en liste brute.

### Mapping glossaire → colonnes réelles

| Glossaire (`Nom_technique`) | Colonne `Produits_DNUM` |
|-----------------------------|-------------------------|
| `Chef_de_produit` | `Product_Manager_Chef_de_projet` |
| `Direction métier` | `Direction_metier` |
| (autres absents / « A supprimer ») | ignorés si absents de la table |

Colonnes présentes hors glossaire (`code`, `ProConnect`, `MFA`, `HDS`, cibles RenovSI, etc.) : **incluses** avec un libellé dérivé.

### Normalisation anti-erreur

- Listes Choice / Ref Grist (`["L", …]`) → liste de valeurs / noms
- Booléens → oui / non
- Dates epoch Grist → date lisible ; **sentinelles** (epoch ≤ 0) → non renseigné
- Champs vides / `null` / listes vides → absents de `fields`, éventuellement dans `missingCritical`
- Textes très longs : plafond ~4000 car. + mention tronqué

---

## Questions or (batterie qualité)

À rejouer avec le service Onyxia + `.env` PARC configuré. Attendu = valeur dans Le PARC (MCP / fiche), ou « non renseigné ».

Script local : [`services/assistant-essai/run_parc_eval.py`](../../../services/assistant-essai/run_parc_eval.py)  
(`--suite basic|complex|explore|aggregate|all`)

| Batterie | Résultats |
|----------|-----------|
| Base | [eval-parc-resultats.md](eval-parc-resultats.md) |
| Complexe (LiteLLM) | [eval-parc-complexe-resultats.md](eval-parc-complexe-resultats.md) |
| Explore DAT / DICT (LiteLLM) | [eval-parc-explore-dat-resultats.md](eval-parc-explore-dat-resultats.md) |
| Agrégats parc (LiteLLM) | [eval-parc-agregats-resultats.md](eval-parc-agregats-resultats.md) |
| Rôle chef de projet | [eval-parc-role-cdp-resultats.md](eval-parc-role-cdp-resultats.md) |
| Rôle responsable de département | [eval-parc-role-manager-resultats.md](eval-parc-role-manager-resultats.md) |
| Rôle direction | [eval-parc-role-direction-resultats.md](eval-parc-role-direction-resultats.md) |

1. Hébergeur d’**Accolade** → `Hebergement` / Infogérant  
2. Département SDPC d’**Accolade** → `Departement_SDPC`  
3. **Accolade** en monorepo ? → booléen exact  
4. Taux RGAA d’un produit **sans** valeur → « non renseigné dans Le PARC »  
5. Chef de produit → noms résolus (`Product_Manager_Chef_de_projet`)  
6. Nom inconnu / ambigu → candidats ou guidage, **pas** de fiche inventée  
7. Produit multi-mots (**DSN BDD** vs **DSN**) → matching du libellé le plus long  
8. Besoins **DAT** (= **DICT** : disponibilité, intégrité, confidentialité, traçabilité)  
9. Produits **DATIA** (ex. DATIA TBD, TDB IA DAT'IA)  
10. Taux RGAA renseigné → affichage en **pourcentage** dans les faits (`81 %`)  
11. Questions sur **l’ensemble du parc** (moyenne RGAA, comptages) → agrégat serveur, pas « produit ambigu »
12. **Liste** demandée (liste, tableau, lesquels) → tableau Markdown construit par le service (ex. produit + taux RGAA renseigné), pas un simple décompte
13. **Seuil** sur le taux de conformité (« supérieur ou égal à 80 % ») → nombre de produits qui l’atteignent, parmi les fiches où le taux est renseigné
14. **Relance** « liste ces produits » → le même critère, en tableau (la question précédente est renvoyée par le widget)
15. **Produits stratégiques** → fiches dont la colonne « Produit stratégique » est renseignée, hors vide et hors « N/A ». « Non stratégique » compte (c’est la tuile du tableau de bord)
16. **Produits à compléter** → fiches avec au moins une information critique manquante. Ce n’est pas le taux de complétion
17. **Onglet Homologations** du tableau de bord → mêmes tuiles : produits homologués (y compris « Homologation non engagée », hors « en cours »), homologations en cours, fin de validité dépassée, échéance dans 90 jours, échéance dans 180 jours, sans date de fin, statut d’homologation vide, critiques ou essentiels non homologués ou expirés
18. **Onglet Maturité et qualité** → fiches sans vision et stratégie, sans connaissance utilisateurs, sans mesure d’impact, sans delivery et itération ; maturité incomplète dès qu’une de ces quatre informations manque ; complétion moyenne arrondie

---

## Config serveur

Voir [service-essai.md](service-essai.md) et `services/assistant-essai/` :

```bash
GRIST_BASE_URL=https://grist.numerique.gouv.fr/api
GRIST_API_KEY=…          # Viewer suffit
GRIST_DOC_ID_PARC=vjbmAgqvttQH
```

`GET /health` expose `parcConfigured` (sans secrets).

Le widget envoie `context.entityType: "parc_produit"` et `screen: "/assistant-parc"` ; le serveur construit les faits avant d’appeler LiteLLM.

---

## Droits

**N/A `Page_*`** : page fixée ouverte (tous rôles), comme la feuille de route. Rappel Admin dans « Fixés par rôle ».
