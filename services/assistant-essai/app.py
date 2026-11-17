"""
Service d’essai Assistant Pilotage — contrat V0 (Python / FastAPI).

GET  /health
POST /v1/ask  { question, context? } → { message, data }

Secrets via env : LITELLM_* , ASSISTANT_SHARED_SECRET , CORS_ORIGINS , PORT.
Idéal pour Onyxia « Vscode-python ». Compatible Python 3.9+.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional, Union

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

LITELLM_BASE_URL = (os.environ.get("LITELLM_BASE_URL") or "").rstrip("/")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY") or ""
LITELLM_MODEL = os.environ.get("LITELLM_MODEL") or "mistral-small"
SHARED_SECRET = os.environ.get("ASSISTANT_SHARED_SECRET") or ""
CORS_ORIGINS = [
    o.strip()
    for o in (
        os.environ.get("CORS_ORIGINS")
        or "http://localhost:5175,https://dnum-socialgouv.github.io"
    ).split(",")
    if o.strip()
]

SYSTEM_PROMPT = (
    "Tu es l’assistant de lecture du Pilotage studios "
    "(missions, bons de commande, produits, CRA). "
    "Tu réponds en français, clairement, sans jargon inutile. "
    "Tu n’inventes pas de montants ni de jours : si tu n’as pas de chiffre "
    "fourni dans le message, dis-le et pose une question de clarification. "
    "Tu ne proposes pas de modifier Grist."
)

app = FastAPI(title="pilotage-assistant-essai", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class AskContext(BaseModel):
    screen: Optional[str] = None
    entityType: Optional[str] = None
    entityId: Optional[Union[int, str]] = None
    entityLabel: Optional[str] = None
    facts: Optional[Dict[str, Any]] = None


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    context: Optional[AskContext] = None


class AskResponse(BaseModel):
    message: str
    data: Optional[Any] = None


def _authorize(authorization: Optional[str]) -> None:
    if not SHARED_SECRET:
        return
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Jeton manquant ou invalide."},
        )
    token = authorization.split(" ", 1)[1].strip()
    if token != SHARED_SECRET:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Jeton manquant ou invalide."},
        )


def _format_context(context: Optional[AskContext]) -> str:
    if context is None:
        return ""
    bits = []
    if context.screen:
        bits.append("Écran : {0}".format(context.screen))
    if context.entityType and context.entityLabel:
        bits.append(
            "Élément ouvert : {0} — {1}".format(context.entityType, context.entityLabel)
        )
    elif context.entityType:
        bits.append("Type d’élément : {0}".format(context.entityType))
    if context.entityId is not None:
        bits.append("Id : {0}".format(context.entityId))
    if context.facts:
        bits.append(
            "Faits fournis (ne pas inventer ailleurs) : {0}".format(context.facts)
        )
    if not bits:
        return ""
    return "\n\nContexte widget :\n- " + "\n- ".join(bits)


async def _call_litellm(question: str, context: Optional[AskContext]) -> str:
    if not LITELLM_BASE_URL or not LITELLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "litellm_not_configured",
                "message": (
                    "Service d’essai : LiteLLM n’est pas configuré "
                    "(LITELLM_BASE_URL / LITELLM_API_KEY)."
                ),
            },
        )
    user_content = "{0}{1}".format(question.strip(), _format_context(context))
    url = "{0}/chat/completions".format(LITELLM_BASE_URL)
    payload = {
        "model": LITELLM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {0}".format(LITELLM_API_KEY),
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "litellm_upstream",
                "message": "Le service de modèles a renvoyé une erreur. Réessayez plus tard.",
            },
        ) from exc

    if res.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "litellm_upstream",
                "message": "Le service de modèles a renvoyé une erreur. Réessayez plus tard.",
            },
        )
    data = res.json()
    try:
        message = data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError, AttributeError):
        message = "Je n’ai pas pu formuler de réponse."
    return message or "Je n’ai pas pu formuler de réponse."


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "pilotage-assistant-essai",
        "runtime": "python",
        "litellmConfigured": bool(LITELLM_BASE_URL and LITELLM_API_KEY),
        "authRequired": bool(SHARED_SECRET),
        "model": LITELLM_MODEL,
    }


@app.post("/v1/ask", response_model=AskResponse)
async def ask(
    body: AskRequest,
    authorization: Optional[str] = Header(default=None),
) -> AskResponse:
    _authorize(authorization)
    question = body.question.strip()
    if not question:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "missing_question",
                "message": "Le champ « question » est obligatoire.",
            },
        )
    message = await _call_litellm(question, body.context)
    # `data` réservé aux tableaux / graphiques (#144) — null en V0 texte.
    return AskResponse(message=message, data=None)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)},
    )
