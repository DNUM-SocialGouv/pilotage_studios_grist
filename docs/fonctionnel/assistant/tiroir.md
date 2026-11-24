# Tiroir Assistant (essai)

## En clair

Un bouton **Assistant** (au-dessus de « Un retour ? ») ouvre un panneau depuis **n’importe quel écran**. Vous y collez l’URL Onyxia du port 5000 et le jeton partagé, puis posez une question. Les réponses viennent du service d’essai — **lecture seule**, pas d’écriture Grist.

Issue : [#139](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/139).

## Comment l’utiliser (essai)

1. Lancer le service Onyxia + `uvicorn` (voir [service-essai.md](service-essai.md)).
2. Dans le widget : **Mon compte** (avatar en haut à droite) → **Connexion Assistant** :
   - URL = lien « port personnalisé 5000 » Mes services ;
   - Jeton = `ASSISTANT_SHARED_SECRET` du `.env` serveur ;
   - **Tester la connexion** puis **Enregistrer**.
3. Poser une question sur l’accueil ou via le bouton **Assistant** → réponse texte.

La config est gardée dans **sessionStorage** de l’onglet (pas dans git, pas la clé LiteLLM). Fermer l’onglet = resaisir éventuellement. Si la connexion manque, l’Assistant propose un bouton **Connexion Assistant** (même modale que le menu compte).

## CORS côté Onyxia

Le serveur doit autoriser l’origine du widget. Dans le `.env` du service :

```bash
CORS_ORIGINS=http://localhost:5175,https://dnum-socialgouv.github.io
```

Puis **relancer** uvicorn. Si vous servez le widget depuis une autre URL Pages / preview, ajoutez-la.

## Adresses autorisées dans le widget publié

Le widget dans Grist n’appelle que Grist et les adresses Onyxia du **port personnalisé** (`https://….user.lab.sspcloud.fr`). Une autre adresse est bloquée par le navigateur : le test affiche « Impossible de joindre le service », même si le serveur tourne.

## Outil mission (#140)

Si la question parle de jours / CRA / TTC / budget d’une **mission**, le widget charge Missions · Prestations · Realise, calcule les faits (`assistantMissionFacts`) et les envoie dans `context.facts` — le modèle ne recalcule pas. Contrat : [contrat-chiffres.md](contrat-chiffres.md).

**Usage** : poser la question avec le **nom** de la mission (ex. VAO, JPME, ou un extrait comme « Site Eaux » pour « Refonte sites eaux »). Le matching tolère le **singulier / pluriel** et plusieurs mots utiles ; si plusieurs missions restent possibles, l’assistant liste des candidats. L’id reste un secours technique, pas poussé dans les messages.

## Accueil

Sur `/`, le panneau remplace les anciens raccourcis CTA (colonne gauche) — plus grand. Sur les autres écrans : bouton flottant + tiroir.

## Hors scope V0 tiroir

- Outils BDC / produit (#141–#142)
- Contexte page générique hors `/missions/:id` (#143)
- Tableaux / graphiques (#144)
- Colonne `Page_*` (essai flottant / accueil, comme le feedback)

## Droits

**N/A `Page_*`** : panneau flottant essai, visible dès que le widget charge (comme le feedback). Restreindre plus tard (#145) si besoin.
