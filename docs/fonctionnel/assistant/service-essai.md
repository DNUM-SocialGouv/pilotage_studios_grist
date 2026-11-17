# Service d’essai (hors widget)

## En clair

Le widget ne contient **aucune** clé de modèle. Un petit serveur (dossier `services/assistant-essai/`) tourne sur Onyxia ou en local, parle à LiteLLM, et renvoie une réponse texte. Plus tard, le même format servira sur un serveur dédié.

Sur Onyxia : lancer **Vscode-python** (pas vLLM, pas GPU) et démarrer l’app **FastAPI** (`app.py`) — voir le README du service.

## Smoke données — base test `iAEEspLuAiuP` (2026-11-17)

| Table | Lignes (ordre de grandeur) | Utile pour |
|-------|----------------------------|------------|
| `Plan_activite` | 13 | Ancre widget |
| `Missions` | 138 | Questions mission (#140) |
| `Prestations` | 427 | Lien CRA / conso |
| `BDC` | 98 | Reste à consommer (#141) |
| `Realise` | 1119 | Consommation |
| `Equipe` | 89 | Contexte personnes |

Smoke **UI** (manuel, Owner) : brancher le Custom Widget sur ce document, Select Data = `Plan_activite`, ouvrir liste Missions puis une fiche et un écran CRA.

## Contrat

Voir le README technique : [`services/assistant-essai/README.md`](../../../services/assistant-essai/README.md).

| Route | Rôle |
|-------|------|
| `GET /health` | Le service répond |
| `POST /v1/ask` | `{ question, context? }` → `{ message, data }` |

## Secrets

| Où | Quoi |
|----|------|
| Serveur (env Onyxia) | `LITELLM_API_KEY`, `ASSISTANT_SHARED_SECRET`, URL LiteLLM |
| Widget (plus tard) | **Uniquement** l’URL publique du service (+ éventuellement un jeton court) — **pas** la clé LiteLLM |
| Git | `.env.example` seulement |

## Issue

[#138](https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/138)
