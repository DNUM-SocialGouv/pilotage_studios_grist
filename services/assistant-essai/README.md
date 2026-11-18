# Service d’essai — Assistant Pilotage

## En clair

Petit serveur **à côté** du widget Grist : question → **votre LiteLLM** → réponse texte.  
Clés sur le serveur uniquement. Sur Onyxia : **Vscode-python** + port **5000**.

Guide métier / checklist relance : [`docs/fonctionnel/assistant/service-essai.md`](../../docs/fonctionnel/assistant/service-essai.md).  
Issue : [#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138).

---

## Relancer vite (Onyxia)

1. Catalogue → **Vscode-python** → formulaire → **Network access** ON → port **5000** → Lancer.  
2. Noter l’URL `https://user-…-user.user.lab.sspcloud.fr` (Mes services).  
3. Dans le terminal VS Code :

```bash
cd ~/work
git clone -b feat/assistant-pilotage-essai https://github.com/DNUM-SocialGouv/pilotage_studios_grist.git
cd pilotage_studios_grist/services/assistant-essai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env && nano .env   # coller la sauvegarde privée des secrets
set -a && source .env && set +a
uvicorn app:app --host 0.0.0.0 --port 5000
```

4. Tests :

```bash
curl -s http://127.0.0.1:5000/health
curl -s https://URL-PUBLIQUE-USER/health
```

**Important** : sauvegarder `.env` hors Onyxia avant tout delete du service. L’URL publique **change** à chaque nouveau déploiement.

### `.env` attendu (LiteLLM Fabrique)

```bash
PORT=5000
LITELLM_BASE_URL=https://litellm.pliage-prod.socle-ia.data-ia.prod.atlas.fabrique.social.gouv.fr/v1
LITELLM_API_KEY=…
LITELLM_MODEL=deepseek-v4.1-flash
ASSISTANT_SHARED_SECRET=…
# ASSISTANT_DEBUG=1
```

Ne pas utiliser `https://llm.lab.sspcloud.fr` pour cet essai.

---

## Contrat API

### `GET /health`

```json
{
  "ok": true,
  "service": "pilotage-assistant-essai",
  "runtime": "python",
  "litellmConfigured": true,
  "litellmBaseUrl": "https://…/v1",
  "authRequired": true,
  "model": "…",
  "debug": false
}
```

### `POST /v1/ask`

```http
Authorization: Bearer <ASSISTANT_SHARED_SECRET>
Content-Type: application/json
```

```json
{ "question": "…", "context": { } }
```

→ `{ "message": "…", "data": null }`

Astuce bash (éviter que `!` dans le secret casse la commande) :

```bash
set -a && source .env && set +a
curl -s http://127.0.0.1:5000/v1/ask \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${ASSISTANT_SHARED_SECRET}" \
  -d '{"question":"Dis bonjour en une phrase."}'
```

---

## Local (hors Onyxia)

```bash
cd services/assistant-essai
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # éditer
set -a && source .env && set +a
uvicorn app:app --host 127.0.0.1 --port 8080 --reload
```

Variante Node optionnelle : `npm start` (`server.mjs`).

---

## Bascule serveur dédié

Mêmes routes `/health` et `/v1/ask`. Changer URL + secrets + CORS / auth.
