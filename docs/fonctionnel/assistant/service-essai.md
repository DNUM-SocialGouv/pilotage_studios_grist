# Service d’essai (hors widget)

## En clair

Pour que l’assistant puisse répondre, un **petit serveur** tourne à côté de Grist (sur Onyxia). Il reçoit la question, appelle **votre LiteLLM** (pas les modèles SSP Cloud du datalab), et renvoie un texte. Les clés restent sur ce serveur.  
Si vous **supprimez** le VS Code Onyxia, le code se récupère via GitHub ; le fichier **`.env`** (clés), lui, doit être **sauvegardé de votre côté** avant suppression.

Issue : [#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138).  
Détail technique : [`services/assistant-essai/README.md`](../../../services/assistant-essai/README.md).

---

## Ce qu’il faut retenir

| Élément | Où | Survivre à un delete Onyxia ? |
|--------|-----|-------------------------------|
| Code FastAPI | GitHub branche `feat/assistant-pilotage-essai` (puis `main` après merge) | Oui (`git clone`) |
| `.env` (clés) | Uniquement sur la machine Onyxia + **votre copie privée** | Non — à resaisir |
| URL publique port 5000 | Change à **chaque** nouveau service | À noter dans Mes services |
| Process `uvicorn` | Terminal VS Code | Non — à relancer à chaque session |

**Modèles** : LiteLLM Fabrique / pliage-prod (ex. `scaleway/deepseek-v4.1-flash` ou le nom que vous mettez dans `.env`).  
**Pas** `https://llm.lab.sspcloud.fr` pour cet essai.

**Base Grist de test** : `iAEEspLuAiuP` (`Pilotage_studio_16-11`) — widget pointé ici pendant l’essai.

---

## Checklist — relancer depuis zéro

### A. Lancer Vscode-python avec le port 5000

1. [datalab.sspcloud.fr](https://datalab.sspcloud.fr/) → **Catalogue** → **Vscode-python** → **Lancer** (ouvre le **formulaire**).
2. Section **Network access** :
   - activer « Enable access to your service through specific ports » ;
   - **Ports 1** = `5000`.
3. **Lancer** (bouton bleu du formulaire).
4. Dans **Mes services**, noter :
   - URL **VS Code** (éditer / terminal) ;
   - URL **port personnalisé 5000** (souvent `https://user-…-user.user.lab.sspcloud.fr`)  
     → message du type : *« Vous pouvez vous connecter à votre port personnalisé (5000) en utilisant ce lien »*.

Sans `uvicorn` démarré, cette URL publique renvoie **502** : c’est normal.

### B. Remettre le code et le `.env`

Dans le terminal VS Code, **commande par commande** :

```bash
cd ~/work
git clone -b feat/assistant-pilotage-essai https://github.com/DNUM-SocialGouv/pilotage_studios_grist.git
cd pilotage_studios_grist/services/assistant-essai

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env
```

Contenu typique du `.env` (valeurs à coller depuis **votre** sauvegarde privée) :

```bash
PORT=5000

# Avec /v1 — LiteLLM OpenAI-compatible
LITELLM_BASE_URL=https://litellm.pliage-prod.socle-ia.data-ia.prod.atlas.fabrique.social.gouv.fr/v1

LITELLM_API_KEY=…          # clé LiteLLM (pas la clé SSP Cloud llm.lab)
LITELLM_MODEL=…            # ex. deepseek-v4.1-flash ou scaleway/deepseek-v4.1-flash

ASSISTANT_SHARED_SECRET=…  # jeton widget ↔ serveur (différent de la clé LiteLLM)

# Optionnel pour diagnostiquer : ASSISTANT_DEBUG=1
```

Sauver nano : `Ctrl+O`, Entrée, `Ctrl+X`.

### C. Démarrer le serveur

```bash
cd ~/work/pilotage_studios_grist/services/assistant-essai
source .venv/bin/activate
set -a && source .env && set +a
uvicorn app:app --host 0.0.0.0 --port 5000
```

Laisser ce terminal **ouvert** (`Uvicorn running on http://0.0.0.0:5000`).

### D. Vérifier

**Dans un 2ᵉ terminal Onyxia :**

```bash
curl -s http://127.0.0.1:5000/health
```

**Sur votre Mac** (remplacer par l’URL Mes services du jour) :

```bash
curl -s https://user-XXXX-user.user.lab.sspcloud.fr/health
```

Attendu : `"ok":true`, `"litellmConfigured":true`.

Puis question (avec le secret du `.env`) :

```bash
cd ~/work/pilotage_studios_grist/services/assistant-essai
set -a && source .env && set +a

curl -s http://127.0.0.1:5000/v1/ask \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ASSISTANT_SHARED_SECRET}" \
  -d '{"question":"Dis bonjour en une phrase."}'
```

Attendu : `{"message":"…","data":null}`.

---

## Contrat API (rappel)

| Route | Rôle |
|-------|------|
| `GET /health` | Service vivant + modèle / URL LiteLLM (sans secrets) |
| `POST /v1/ask` | `{ "question": "…" }` → `{ "message": "…", "data": null }` |
| Auth | Si `ASSISTANT_SHARED_SECRET` est défini : en-tête `Authorization: Bearer …` |

---

## Pièges déjà rencontrés

| Symptôme | Cause probable | Remède |
|----------|----------------|--------|
| `cd … assistant-essai: No such file` | Volume `work` vide après delete | Refaire le `git clone` |
| `curl` local sans réponse | `uvicorn` pas démarré | Lancer `uvicorn` et le laisser tourner |
| `unauthorized` | Bearer ≠ `.env` ou `!` cassé par bash | Utiliser `"Bearer ${ASSISTANT_SHARED_SECRET}"` après `source .env` |
| `litellm_upstream` alors que curl LiteLLM marche | Mauvaise URL (sans `/v1`) **ou** uvicorn lancé avec un vieux `.env` | Mettre `…/v1` ; **Ctrl+C** et relancer uvicorn |
| Clé LiteLLM + URL `llm.lab.sspcloud.fr` | Mélange de deux fournisseurs | Une seule paire URL + clé (LiteLLM Fabrique) |
| 502 sur l’URL `…-user…` | `uvicorn` arrêté ou mauvais port | Relancer sur **5000** ; vérifier Network access |

---

## Avant de supprimer le service Onyxia

1. Copier le `.env` dans un endroit **privé** (pas GitHub, pas issue, pas chat).  
2. Le code utile est déjà (ou sera) sur GitHub — un `git status` propre si vous avez modifié quelque chose localement.  
3. Puis seulement : poubelle dans **Mes services**.

---

## Suite produit

- Tiroir widget partout → issue [#139](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/139)  
- Questions métier mission / BDC / produit → [#140](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/140)–[#142](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/142)  
- Serveur dédié plus tard : **mêmes** routes `/health` et `/v1/ask`
