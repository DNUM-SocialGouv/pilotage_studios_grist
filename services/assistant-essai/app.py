"""
Service d’essai Assistant Pilotage — contrat V0 (Python / FastAPI).

GET  /health
POST /v1/ask  { question, context? } → { message, data }

Secrets via env : LITELLM_* , ASSISTANT_SHARED_SECRET , CORS_ORIGINS , PORT.
ASSISTANT_DEBUG=1 → détail d’erreur LiteLLM dans la réponse JSON (essai seulement).
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional, Union

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

SYSTEM_PROMPT = (
    "Tu es l’assistant de lecture du Pilotage studios "
    "(missions, bons de commande, produits, CRA). "
    "Tu réponds en français, clairement, sans jargon inutile. "
    "Tu n’inventes pas de montants ni de jours : si tu n’as pas de chiffre "
    "fourni dans le message, dis-le et pose une question de clarification. "
    "Tu ne proposes pas de modifier Grist."
)


def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def _litellm_config() -> Dict[str, str]:
    return {
        "base_url": _env("LITELLM_BASE_URL").rstrip("/"),
        "api_key": _env("LITELLM_API_KEY"),
        "model": _env("LITELLM_MODEL", "mistral-small"),
    }


def _shared_secret() -> str:
    return _env("ASSISTANT_SHARED_SECRET")


def _debug() -> bool:
    return _env("ASSISTANT_DEBUG") in ("1", "true", "True", "yes")


def _cors_origins() -> list:
    raw = _env(
        "CORS_ORIGINS",
        "http://localhost:5175,https://dnum-socialgouv.github.io",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="pilotage-assistant-essai", version="0.1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
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
    secret = _shared_secret()
    if not secret:
        return
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Jeton manquant ou invalide."},
        )
    token = authorization.split(" ", 1)[1].strip()
    if token != secret:
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


def _upstream_detail(status: int, body: str) -> Dict[str, Any]:
    detail = {
        "error": "litellm_upstream",
        "message": "Le service de modèles a renvoyé une erreur. Réessayez plus tard.",
    }
    if _debug():
        detail["debugStatus"] = status
        detail["debugBody"] = body[:500]
    return detail


async def _call_litellm(question: str, context: Optional[AskContext]) -> str:
    cfg = _litellm_config()
    if not cfg["base_url"] or not cfg["api_key"]:
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
    url = "{0}/chat/completions".format(cfg["base_url"])
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {0}".format(cfg["api_key"]),
    }
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            res = await client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        print("[ask] litellm HTTPError:", type(exc).__name__, exc)
        raise HTTPException(
            status_code=502,
            detail=_upstream_detail(0, str(exc)),
        ) from exc

    body_text = res.text
    if res.status_code >= 400:
        print(
            "[ask] litellm upstream",
            res.status_code,
            "url=",
            url,
            "model=",
            cfg["model"],
            "body=",
            body_text[:500],
        )
        raise HTTPException(
            status_code=502,
            detail=_upstream_detail(res.status_code, body_text),
        )
    data = res.json()
    try:
        raw = data["choices"][0]["message"].get("content")
        message = (raw or "").strip()
    except (KeyError, IndexError, TypeError, AttributeError):
        message = ""
    return message or "Je n’ai pas pu formuler de réponse."


@app.get("/health")
async def health() -> Dict[str, Any]:
    cfg = _litellm_config()
    return {
        "ok": True,
        "service": "pilotage-assistant-essai",
        "runtime": "python",
        "litellmConfigured": bool(cfg["base_url"] and cfg["api_key"]),
        "litellmBaseUrl": cfg["base_url"],
        "authRequired": bool(_shared_secret()),
        "model": cfg["model"],
        "debug": _debug(),
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
    return AskResponse(message=message, data=None)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)},
    )
