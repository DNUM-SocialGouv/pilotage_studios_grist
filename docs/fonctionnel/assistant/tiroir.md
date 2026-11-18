# Tiroir Assistant (essai)

## En clair

Un bouton **Assistant** (au-dessus de « Un retour ? ») ouvre un panneau depuis **n’importe quel écran**. Vous y collez l’URL Onyxia du port 5000 et le jeton partagé, puis posez une question. Les réponses viennent du service d’essai — **lecture seule**, pas d’écriture Grist.

Issue : [#139](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/139).

## Comment l’utiliser (essai)

1. Lancer le service Onyxia + `uvicorn` (voir [service-essai.md](service-essai.md)).
2. Dans le widget : bouton **Assistant**.
3. **Paramètres de connexion** :
   - URL = lien « port personnalisé 5000 » Mes services ;
   - Jeton = `ASSISTANT_SHARED_SECRET` du `.env` serveur ;
   - **Tester la connexion** puis **Enregistrer**.
4. Poser une question → réponse texte.

La config est gardée dans **sessionStorage** de l’onglet (pas dans git, pas la clé LiteLLM). Fermer l’onglet = resaisir éventuellement.

## CORS côté Onyxia

Le serveur doit autoriser l’origine du widget. Dans le `.env` du service :

```bash
CORS_ORIGINS=http://localhost:5175,https://dnum-socialgouv.github.io
```

Puis **relancer** uvicorn. Si vous servez le widget depuis une autre URL Pages / preview, ajoutez-la.

## Hors scope V0 tiroir

- Calculs budget / BDC fiables (#140–#142)
- Contexte « cette mission » (#143)
- Tableaux / graphiques (#144)
- Colonne `Page_*` (essai flottant, comme le feedback)

## Droits

**N/A `Page_*`** : panneau flottant essai, visible dès que le widget charge (comme le feedback). Restreindre plus tard (#145) si besoin.
