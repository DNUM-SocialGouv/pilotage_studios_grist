# Service d’essai — Assistant Pilotage

## En clair

Petit serveur **à côté** du widget Grist : il reçoit une question, appelle le proxy de modèles (LiteLLM), et renvoie une réponse texte. Les **clés restent sur le serveur** (Onyxia ou machine locale), jamais dans le navigateur. Quand l’essai aura prouvé sa valeur, on pourra déplacer ce même contrat sur un serveur dédié.

Issue : [#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138).

**Runtime recommandé sur Onyxia** : **Python / FastAPI** (`app.py`) via le catalogue **Vscode-python**.  
Une variante Node (`server.mjs`) reste disponible en local si besoin.

## Contrat API (identique Python / Node)

### `GET /health`

```json
{
  "ok": true,
  "service": "pilotage-assistant-essai",
  "runtime": "python",
  "litellmConfigured": true,
  "authRequired": true,
  "model": "mistral-small"
}
```

### `POST /v1/ask`

En-tête optionnel : `Authorization: Bearer <ASSISTANT_SHARED_SECRET>`  
(si `ASSISTANT_SHARED_SECRET` est défini).

**Corps**

```json
{
  "question": "Quel reste à consommer sur le BDC Y ?",
  "context": {
    "screen": "/bdc/14",
    "entityType": "bdc",
    "entityId": 14,
    "entityLabel": "2024-2210D17 …",
    "facts": {}
  }
}
```

**Réponse 200**

```json
{
  "message": "Texte pour l’humain…",
  "data": null
}
```

`data` est réservé aux affichages structurés (tableaux / graphiques, issue #144).

---

## Onyxia — Vscode-python (chemin recommandé)

1. Catalogue → **Vscode-python** → **Lancer** (pas besoin de GPU / TensorFlow / PyTorch).
2. Dans le terminal du VS Code Onyxia :

```bash
git clone https://github.com/DNUM-SocialGouv/pilotage_studios_grist.git
cd pilotage_studios_grist/services/assistant-essai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env : LITELLM_BASE_URL, LITELLM_API_KEY, LITELLM_MODEL, ASSISTANT_SHARED_SECRET
```

3. Charger les variables puis démarrer :

```bash
set -a && source .env && set +a
uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}
```

4. Ouvrir l’URL HTTPS du service (bouton / panneau Onyxia pour le port 8080).
5. Tester :

```bash
curl -s https://VOTRE-URL-ONYXIA/health
curl -s -X POST https://VOTRE-URL-ONYXIA/v1/ask \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ASSISTANT_SHARED_SECRET" \
  -d '{"question":"Bonjour, présente-toi en une phrase."}'
```

**Ne pas** committer `.env`. Préférer les secrets / variables d’environnement du service Onyxia si disponibles.

**vLLM** : inutile pour cet essai si LiteLLM fournit déjà les modèles (vLLM = héberger un modèle soi-même, souvent GPU).

---

## Lancer en local (Python)

```bash
cd services/assistant-essai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis éditer
set -a && source .env && set +a
uvicorn app:app --host 127.0.0.1 --port 8080 --reload
```

## Variante Node (optionnelle)

```bash
cd services/assistant-essai
cp .env.example .env
npm start   # node server.mjs
```

## Bascule serveur dédié

Conserver **les mêmes routes** `/health` et `/v1/ask` et le même JSON. Changer seulement l’URL, le stockage des secrets, et éventuellement CORS / auth.

## Hors scope

- Écriture Grist  
- Clés dans le bundle widget  
- Outils métier mission/BDC (issues #140–#142)  
- vLLM / GPU sauf besoin explicite plus tard  
