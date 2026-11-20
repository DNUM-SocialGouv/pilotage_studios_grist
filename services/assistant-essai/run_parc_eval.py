#!/usr/bin/env python3
"""
Batterie d’évaluation Assistant PARC (hors widget).

Charge `.env` local puis GRIST_* + LITELLM_* (repli Albert si besoin).

Usage :
  python run_parc_eval.py --suite complex \\
    --out ../../docs/fonctionnel/assistant/eval-parc-complexe-resultats.md
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from parc_eval_cases import cases_for_suite
from parc_facts import PARC_SYSTEM_PROMPT, parc_configured, resolve_parc_facts


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        key, val = s.split("=", 1)
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        if key and key not in os.environ:
            os.environ[key] = val


def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def _llm_config(*, require_litellm: bool = False) -> Dict[str, str]:
    base = _env("LITELLM_BASE_URL")
    key = _env("LITELLM_API_KEY")
    model = _env("LITELLM_MODEL")
    provider = "litellm"
    if not base or not key:
        if require_litellm:
            raise RuntimeError("LITELLM_BASE_URL / LITELLM_API_KEY manquants dans .env")
        key = _env("ALBERT_API_KEY")
        base = _env("ALBERT_BASE_URL", "https://albert.api.etalab.gouv.fr/v1")
        model = _env("ALBERT_MODEL", "mistral-small-3-2-24b-instruct-2506")
        provider = "albert"
    return {
        "base_url": base.rstrip("/"),
        "api_key": key,
        "model": model,
        "provider": provider,
    }


def _facts_for_llm(facts: Any) -> Any:
    """Retire les clés « source » pour éviter le copier-coller en bas de réponse."""
    if isinstance(facts, list):
        return [_facts_for_llm(x) for x in facts]
    if not isinstance(facts, dict):
        return facts
    out: Dict[str, Any] = {}
    for key, val in facts.items():
        if key == "source":
            continue
        if key == "products" and isinstance(val, list):
            out[key] = [_facts_for_llm(p) for p in val]
        else:
            out[key] = _facts_for_llm(val) if isinstance(val, (dict, list)) else val
    return out


async def ask_llm(question: str, facts: Dict[str, Any], cfg: Dict[str, str]) -> str:
    user = (
        "{0}\n\nContexte widget :\n"
        "- Écran : /assistant-parc\n"
        "- Type d’élément : parc_produit\n"
        "- Faits fournis (ne pas inventer ailleurs) : {1}"
    ).format(question, json.dumps(_facts_for_llm(facts), ensure_ascii=False, default=str))
    url = "{0}/chat/completions".format(cfg["base_url"])
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": PARC_SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        "temperature": 0.1,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {0}".format(cfg["api_key"]),
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(url, json=payload, headers=headers)
    if res.status_code >= 400:
        raise RuntimeError("LLM HTTP {0}: {1}".format(res.status_code, res.text[:400]))
    data = res.json()
    try:
        return (data["choices"][0]["message"].get("content") or "").strip()
    except (KeyError, IndexError, TypeError, AttributeError) as exc:
        raise RuntimeError("Réponse LLM illisible: {0}".format(data)[:400]) from exc


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def score_answer(case: Dict[str, Any], answer: str) -> Dict[str, Any]:
    n = _norm(answer)
    # Déplier accents pour matcher « renseigné » / « renseigne »
    n_flat = (
        n.replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace("ù", "u")
        .replace("ô", "o")
        .replace("î", "i")
        .replace("ç", "c")
    )

    def has(token: str) -> bool:
        t = _norm(token)
        t_flat = (
            t.replace("é", "e")
            .replace("è", "e")
            .replace("ê", "e")
            .replace("à", "a")
            .replace("ù", "u")
            .replace("ô", "o")
            .replace("î", "i")
            .replace("ç", "c")
        )
        return t in n or t_flat in n_flat

    expect_any = case.get("expect_any") or []
    any_hit = [e for e in expect_any if has(e)]
    missing = [] if (not expect_any or any_hit) else list(expect_any)
    forbidden_hit = [e for e in case.get("expect_none", []) if has(e)]

    expect_all = case.get("expect_all") or []
    all_missing = [e for e in expect_all if not has(e)]
    if all_missing:
        missing.extend(["manque obligatoire: " + e for e in all_missing])

    soft = case.get("expect_all_soft") or []
    soft_ok = sum(1 for e in soft if has(e))
    # Soft = signaux utiles (souvent synonymes) : au moins 1, ou ~la moitié si liste longue
    soft_needed = 0
    if soft:
        soft_needed = 1 if len(soft) <= 3 else max(2, (len(soft) + 2) // 3)
    ok = not missing and not forbidden_hit
    if soft and soft_ok < soft_needed:
        ok = False
        missing.append("couverture soft {0}/{1} (seuil {2})".format(soft_ok, len(soft), soft_needed))
    return {
        "ok": ok,
        "missing": missing,
        "forbidden_hit": forbidden_hit,
        "any_hit": any_hit,
    }


async def run_case(case: Dict[str, Any], cfg: Dict[str, str]) -> Dict[str, Any]:
    facts = await resolve_parc_facts(case["question"])
    answer = await ask_llm(case["question"], facts, cfg)
    scored = score_answer(case, answer)
    if facts.get("tool") == "parc_agregat":
        facts_status = "agregat:" + str(facts.get("metric") or "")
    elif facts.get("multi"):
        labels = [
            str(p.get("produit") or p.get("entityLabel") or "")
            for p in (facts.get("products") or [])
        ]
        facts_status = "multi:" + " · ".join([x for x in labels if x])
    elif facts.get("unresolved"):
        facts_status = "unresolved:" + str(facts.get("reason"))
    else:
        facts_status = "matched:" + str(
            facts.get("produit") or facts.get("entityLabel") or ""
        )

    expect_tool = case.get("expect_facts_tool")
    if expect_tool and facts.get("tool") != expect_tool:
        scored["ok"] = False
        scored["missing"] = list(scored.get("missing") or []) + [
            "outil faits (attendu {0}, obtenu {1})".format(
                expect_tool, facts.get("tool")
            )
        ]

    expect_product = case.get("expect_product")
    if expect_product and not facts.get("unresolved") and not facts.get("multi"):
        if facts.get("tool") == "parc_agregat":
            scored["ok"] = False
            scored["missing"] = list(scored.get("missing") or []) + [
                "agrégat au lieu du produit " + expect_product
            ]
        else:
            got = str(facts.get("produit") or "")
            if _norm(got) != _norm(expect_product):
                scored["ok"] = False
                scored["missing"] = list(scored.get("missing") or []) + [
                    "mauvais produit (attendu {0}, obtenu {1})".format(
                        expect_product, got
                    )
                ]

    expect_products = case.get("expect_products") or []
    if expect_products:
        if facts.get("multi"):
            got_set = {
                _norm(str(p.get("produit") or p.get("entityLabel") or ""))
                for p in (facts.get("products") or [])
            }
        else:
            got_set = {_norm(str(facts.get("produit") or facts.get("entityLabel") or ""))}
        for wanted in expect_products:
            if _norm(wanted) not in got_set:
                scored["ok"] = False
                scored["missing"] = list(scored.get("missing") or []) + [
                    "produit manquant dans faits: " + wanted
                ]

    notes: List[str] = []
    if facts.get("unresolved") and facts.get("hint"):
        notes.append("hint outil: " + str(facts.get("hint")))
    if facts.get("candidates"):
        notes.append("candidats: " + ", ".join(facts.get("candidates")[:6]))
    return {
        "id": case["id"],
        "theme": case["theme"],
        "question": case["question"],
        "oracle": case.get("oracle", ""),
        "facts_status": facts_status,
        "answer": answer,
        "notes": notes,
        **scored,
    }


def render_markdown(
    results: List[Dict[str, Any]],
    cfg: Dict[str, str],
    cases: List[Dict[str, Any]],
    *,
    parc_ok: bool,
    suite: str,
) -> str:
    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M %Z")
    passed = sum(1 for r in results if r["ok"])
    total = len(results)
    lines: List[str] = []
    title = "Évaluation Assistant PARC — résultats"
    if suite == "complex":
        title = "Évaluation Assistant PARC — batterie complexe"
    elif suite == "basic":
        title = "Évaluation Assistant PARC — batterie de base"
    elif suite in ("aggregate", "agregat", "agg"):
        title = "Évaluation Assistant PARC — agrégats (ensemble du parc)"
    elif suite in ("explore", "dict", "dat"):
        title = "Évaluation Assistant PARC — explore DAT / DICT"
    elif suite in ("role-cdp", "cdp", "chef-projet"):
        title = "Évaluation Assistant PARC — rôle chef de projet"
    elif suite in ("role-manager", "manager", "responsable"):
        title = "Évaluation Assistant PARC — rôle responsable de département"
    elif suite in ("role-direction", "direction", "dir"):
        title = "Évaluation Assistant PARC — rôle direction"
    elif suite in ("roles", "role"):
        title = "Évaluation Assistant PARC — batteries par rôle"
    lines.append("# {0}".format(title))
    lines.append("")
    lines.append("## En clair")
    lines.append("")
    lines.append(
        "On a posé **{0} questions** sur le référentiel produits (Le PARC), "
        "avec le même principe que l’essai : d’abord une **fiche de faits**, "
        "puis une réponse rédigée par un modèle. "
        "**{1}/{0}** réponses sont jugées conformes aux oracles (valeurs Grist)."
        .format(total, passed)
    )
    lines.append("")
    lines.append("| | |")
    lines.append("|--|--|")
    lines.append("| Date | {0} |".format(now))
    lines.append("| Suite | `{0}` |".format(suite))
    lines.append("| Document | `vjbmAgqvttQH` (Le PARC) |")
    lines.append("| Outil faits | `parc_facts.resolve_parc_facts` (+ multi) |")
    lines.append(
        "| Modèle | `{0}` via **{1}** |".format(cfg["model"], cfg["provider"])
    )
    lines.append("| PARC configuré | {0} |".format("oui" if parc_ok else "non"))
    lines.append("| Score auto | **{0}/{1}** |".format(passed, total))
    lines.append("")
    if cfg["provider"] != "litellm":
        lines.append(
            "> **Note** : LiteLLM non utilisé — repli **Albert**. "
            "Préférer LiteLLM Fabrique pour l’essai produit."
        )
        lines.append("")

    lines.append("## Plan de test (corpus)")
    lines.append("")
    if suite == "complex":
        lines.append(
            "Couverture avancée : synthèse multi-champs, booléens croisés, RenovSI, "
            "comparaisons multi-produits (RGAA, hébergement, IAM), cycle de vie, "
            "piège d’invention."
        )
    else:
        lines.append(
            "Couverture : identité/gouvernance, hébergement, stack, RGAA, "
            "personnes, sparse, inconnu, ambiguïté."
        )
    lines.append("")
    lines.append("| Id | Thème | Question | Oracle (Grist) |")
    lines.append("|----|-------|----------|----------------|")
    for c in cases:
        q = c["question"].replace("|", "/").replace("\n", " ")
        if len(q) > 120:
            q = q[:117] + "…"
        lines.append(
            "| {0} | {1} | {2} | {3} |".format(
                c["id"], c["theme"], q, c.get("oracle", "")
            )
        )
    lines.append("")

    lines.append("## Résultats détaillés")
    lines.append("")
    for r in results:
        badge = "PASS" if r["ok"] else "FAIL"
        lines.append("### {0} — {1}".format(r["id"], badge))
        lines.append("")
        lines.append("- **Question** : {0}".format(r["question"]))
        lines.append("- **Oracle** : {0}".format(r["oracle"]))
        lines.append("- **Faits** : `{0}`".format(r["facts_status"]))
        if r.get("any_hit"):
            lines.append("- **Mots-clés trouvés** : {0}".format(", ".join(r["any_hit"])))
        if r["missing"]:
            lines.append("- **Manque attendu** : {0}".format(", ".join(r["missing"])))
        if r["forbidden_hit"]:
            lines.append(
                "- **Interdit trouvé** : {0}".format(", ".join(r["forbidden_hit"]))
            )
        if r.get("notes"):
            lines.append("- **Notes outil** : {0}".format(" · ".join(r["notes"])))
        lines.append("")
        lines.append("**Réponse modèle**")
        lines.append("")
        lines.append(r["answer"] or "_(vide)_")
        lines.append("")

    fails = [r for r in results if not r["ok"]]
    lines.append("## Analyse")
    lines.append("")
    lines.append("### Synthèse")
    lines.append("")
    lines.append(
        "- Score global : **{0}/{1}** ({2} %)."
        .format(passed, total, round(100 * passed / total) if total else 0)
    )
    themes: Dict[str, List[bool]] = {}
    for r in results:
        themes.setdefault(r["theme"], []).append(r["ok"])
    for theme, oks in themes.items():
        lines.append(
            "- Thème **{0}** : {1}/{2}".format(theme, sum(oks), len(oks))
        )
    lines.append("")
    if not fails:
        lines.append(
            "Aucune erreur auto-détectée sur cette batterie. "
            "Relancer avec LiteLLM Onyxia avant de conclure en prod."
        )
    else:
        lines.append("### Échecs / points d’attention")
        lines.append("")
        for r in fails:
            lines.append(
                "- **{0}** ({1}) : faits=`{2}` — manques={3} interdits={4}".format(
                    r["id"],
                    r["theme"],
                    r["facts_status"],
                    r["missing"] or "—",
                    r["forbidden_hit"] or "—",
                )
            )
        lines.append("")
        lines.append("Pistes d’amélioration typiques :")
        lines.append("")
        lines.append(
            "1. Matching trop large / trop strict (ambiguïté SISE-EAUX, synonymes)."
        )
        lines.append(
            "2. Formulation « non renseigné » pas assez contrainte dans le prompt."
        )
        lines.append(
            "3. Libellés personnes (ordre nom/prénom) vs attente utilisateur."
        )
        lines.append(
            "4. Valeurs numériques RGAA (0,81 vs 81 %) — normaliser dans les faits."
        )
    lines.append("")
    lines.append("### Limites de cette eval")
    lines.append("")
    lines.append(
        "- Scoring **heuristique** (mots-clés), pas une revue métier humaine complète."
    )
    lines.append(
        "- Un seul tour, température basse ; pas de multi-essais."
    )
    lines.append(
        "- Accès Viewer : certains champs peuvent manquer selon le compte API."
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("*Généré par `services/assistant-essai/run_parc_eval.py`.*")
    lines.append("")
    return "\n".join(lines)


async def main() -> int:
    here = Path(__file__).resolve().parent
    _load_dotenv(here / ".env")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--suite",
        choices=[
            "basic",
            "complex",
            "explore",
            "dict",
            "dat",
            "aggregate",
            "agregat",
            "agg",
            "role-cdp",
            "cdp",
            "chef-projet",
            "role-manager",
            "manager",
            "responsable",
            "role-direction",
            "direction",
            "dir",
            "roles",
            "role",
            "all",
        ],
        default="complex",
        help="Batterie (roles = CDP + manager + direction)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Fichier markdown de résultats",
    )
    parser.add_argument("--limit", type=int, default=0, help="Limiter le nombre de cas")
    parser.add_argument(
        "--require-litellm",
        action="store_true",
        help="Échouer si LiteLLM n’est pas configuré",
    )
    args = parser.parse_args()

    docs = here.parents[1] / "docs/fonctionnel/assistant"
    if args.out is None:
        if args.suite == "complex":
            args.out = docs / "eval-parc-complexe-resultats.md"
        elif args.suite == "basic":
            args.out = docs / "eval-parc-resultats.md"
        elif args.suite in ("explore", "dict", "dat"):
            args.out = docs / "eval-parc-explore-dat-resultats.md"
        elif args.suite in ("aggregate", "agregat", "agg"):
            args.out = docs / "eval-parc-agregats-resultats.md"
        elif args.suite in ("role-cdp", "cdp", "chef-projet"):
            args.out = docs / "eval-parc-role-cdp-resultats.md"
        elif args.suite in ("role-manager", "manager", "responsable"):
            args.out = docs / "eval-parc-role-manager-resultats.md"
        elif args.suite in ("role-direction", "direction", "dir"):
            args.out = docs / "eval-parc-role-direction-resultats.md"
        elif args.suite in ("roles", "role"):
            args.out = docs / "eval-parc-roles-resultats.md"
        else:
            args.out = docs / "eval-parc-all-resultats.md"

    _litellm_suites = {
        "complex",
        "explore",
        "dict",
        "dat",
        "aggregate",
        "agregat",
        "agg",
        "role-cdp",
        "cdp",
        "chef-projet",
        "role-manager",
        "manager",
        "responsable",
        "role-direction",
        "direction",
        "dir",
        "roles",
        "role",
    }
    try:
        cfg = _llm_config(
            require_litellm=args.require_litellm or args.suite in _litellm_suites
        )
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    if not cfg["api_key"] or not cfg["base_url"]:
        print("Pas de LITELLM_* ni ALBERT_API_KEY — impossible d’interroger un LLM.", file=sys.stderr)
        return 2
    if not parc_configured():
        print("PARC non configuré (GRIST_BASE_URL / GRIST_API_KEY / GRIST_DOC_ID_PARC).", file=sys.stderr)
        return 2

    cases = cases_for_suite(args.suite)
    if args.limit:
        cases = cases[: args.limit]
    print(
        "Running suite={0} · {1} cases via {2} / {3}…".format(
            args.suite, len(cases), cfg["provider"], cfg["model"]
        )
    )
    results: List[Dict[str, Any]] = []
    for case in cases:
        print(" -", case["id"], case["question"][:70].replace("\n", " "), "…")
        try:
            results.append(await run_case(case, cfg))
            print("   →", "PASS" if results[-1]["ok"] else "FAIL")
        except Exception as exc:  # noqa: BLE001
            results.append(
                {
                    "id": case["id"],
                    "theme": case["theme"],
                    "question": case["question"],
                    "oracle": case.get("oracle", ""),
                    "facts_status": "error",
                    "answer": "ERREUR: {0}".format(exc),
                    "ok": False,
                    "missing": ["runtime"],
                    "forbidden_hit": [],
                    "any_hit": [],
                    "notes": [],
                }
            )
            print("   → ERROR", type(exc).__name__, exc)

    md = render_markdown(results, cfg, cases, parc_ok=True, suite=args.suite)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(md, encoding="utf-8")
    print("Wrote", args.out)
    passed = sum(1 for r in results if r["ok"])
    print("Score {0}/{1}".format(passed, len(results)))
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
