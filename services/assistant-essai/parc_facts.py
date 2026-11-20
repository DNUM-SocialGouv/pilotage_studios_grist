"""
Outil faits PARC — lit Produits_DNUM (+ glossaire, Base_RH, parents) et construit
une fiche structurée pour LiteLLM. Lecture seule ; aucune invention côté modèle.
"""

from __future__ import annotations

import re
import time
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

CACHE_TTL_SEC = 600
TEXT_MAX_CHARS = 4000

# Glossaire → colonne réelle Produits_DNUM
COLUMN_ALIASES: Dict[str, str] = {
    "Chef_de_produit": "Product_Manager_Chef_de_projet",
    "Direction métier": "Direction_metier",
    "Direction_metier": "Direction_metier",
}

EXCLUDE_KEYS = frozenset(
    {
        "UUID",
        "id",
    }
)

ADMIN_CATEGORY_MARKERS = ("Administratif", "admin uniquement", "ne pas toucher")

PRODUCT_STOPWORDS = frozenset(
    {
        "produit",
        "produits",
        "application",
        "applications",
        "quel",
        "quelle",
        "quels",
        "quelles",
        "est",
        "sont",
        "pour",
        "sur",
        "dans",
        "avec",
        "chez",
        "le",
        "la",
        "les",
        "un",
        "une",
        "des",
        "du",
        "de",
        "d",
        "l",
        "mon",
        "ma",
        "mes",
        "son",
        "sa",
        "ses",
        "ce",
        "cette",
        "ces",
        "comment",
        "combien",
        "qui",
        "quoi",
        "ou",
        "donc",
        "parc",
        "referentiel",
        "référentiel",
        "info",
        "infos",
        "information",
        "informations",
        "donnees",
        "données",
        "champ",
        "champs",
        "taux",
        "rgaa",
        "hebergeur",
        "hébergeur",
        "hebergement",
        "hébergement",
        "departement",
        "département",
        "sdpc",
        "chef",
        "projet",
        "manager",
        "monorepo",
        "oui",
        "non",
        "a",
        "à",
        "il",
        "elle",
        "etre",
        "être",
    }
)

CATEGORY_HINTS: List[Tuple[str, Tuple[str, ...]]] = [
    (
        "Sécurité et Conformité",
        (
            "rgaa",
            "homolog",
            "rgpd",
            "aipd",
            "dict",
            "dat",  # souvent employé pour les besoins DICT
            "disponibilite",
            "disponibilité",
            "integrite",
            "intégrité",
            "confidentialite",
            "confidentialité",
            "tracabilite",
            "traçabilité",
            "securit",
            "sécurit",
            "conform",
        ),
    ),
    (
        "Architecture et Technologies",
        (
            "langage",
            "framework",
            "repo",
            "github",
            "stack",
            "technolog",
            "base de donnee",
            "base de donnée",
            "postgres",
            "auth",
            "iam",
            "dsfr",
            "ci/cd",
            "monorepo",
        ),
    ),
    (
        "Utilisateurs et Exploitation",
        ("heberg", "héberg", "infoger", "support", "critic", "pca", "audience", "volumetr"),
    ),
    (
        "Cycle de Vie",
        ("obsolesc", "decommiss", "mise en prod", "mise en service", "jdma", "strateg"),
    ),
    (
        "Migration Cloud",
        ("atlas", "renov", "cloud", "infogerance", "infogérance"),
    ),
    (
        "Identité et Gouvernance",
        (
            "departement",
            "département",
            "equipe",
            "équipe",
            "chef de produit",
            "direction",
            "statut",
            "description",
            "url",
        ),
    ),
]


_cache: Dict[str, Any] = {
    "fetched_at": 0.0,
    "produits": [],
    "glossary": {},
    "rh": {},
    "parents": {},
}


def _env(name: str, default: str = "") -> str:
    import os

    return (os.environ.get(name) or default).strip()


def parc_configured() -> bool:
    return bool(
        _env("GRIST_BASE_URL")
        and _env("GRIST_API_KEY")
        and _env("GRIST_DOC_ID_PARC", "vjbmAgqvttQH")
    )


def _normalize(s: str) -> str:
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower().replace("'", " ").replace("’", " ").replace("`", " ")
    return re.sub(r"\s+", " ", text).strip()


def _format_rgaa_ratio(value: Any) -> Any:
    """Affiche 0.81 → « 81 % (ratio 0.81) » pour des réponses homogènes."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return value
    if value < 0 or value > 1:
        return value
    pct = round(float(value) * 100, 2)
    if pct == int(pct):
        pct_s = str(int(pct))
    else:
        pct_s = ("{0:.2f}".format(pct)).rstrip("0").rstrip(".")
    ratio = ("{0:.4f}".format(float(value))).rstrip("0").rstrip(".")
    return "{0} % (ratio {1})".format(pct_s, ratio)


def _label_from_key(key: str) -> str:
    return key.replace("_", " ").strip()


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, bool):
        return False
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, (list, tuple)):
        if len(value) == 0:
            return True
        if len(value) == 1 and value[0] == "L":
            return True
    return False


def _looks_like_date_key(key: str) -> bool:
    k = key.lower()
    return (
        "date" in k
        or "validite" in k
        or k.startswith("debut_")
        or k.startswith("fin_")
    )


def _unwrap_list(value: Any) -> Any:
    if isinstance(value, list) and value and value[0] == "L":
        return value[1:]
    return value


def _format_date(epoch: float | int) -> Optional[str]:
    try:
        n = float(epoch)
    except (TypeError, ValueError):
        return None
    if n <= 0:
        return None
    # Grist sometimes stores date as days since epoch-ish; treat as unix seconds if large
    if n > 1e11:
        n = n / 1000.0
    try:
        dt = datetime.fromtimestamp(n, tz=timezone.utc)
        return dt.date().isoformat()
    except (OverflowError, OSError, ValueError):
        return None


def _resolve_value(value: Any, rh: Dict[int, str]) -> Any:
    value = _unwrap_list(value)
    if isinstance(value, bool):
        return "oui" if value else "non"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        # Heuristic: large numbers looking like unix timestamps on date-ish fields handled by caller
        return value
    if isinstance(value, list):
        out: List[Any] = []
        for item in value:
            if isinstance(item, int) and item in rh:
                out.append(rh[item])
            else:
                out.append(item)
        return out
    if isinstance(value, int) and value in rh:
        return rh[value]
    return value


def _truncate(text: str) -> Tuple[str, bool]:
    if len(text) <= TEXT_MAX_CHARS:
        return text, False
    return text[: TEXT_MAX_CHARS - 1] + "…", True


async def _grist_records(table_id: str) -> List[Dict[str, Any]]:
    base = _env("GRIST_BASE_URL").rstrip("/")
    doc = _env("GRIST_DOC_ID_PARC", "vjbmAgqvttQH")
    key = _env("GRIST_API_KEY")
    url = "{0}/docs/{1}/tables/{2}/records".format(base, doc, table_id)
    headers = {"Authorization": "Bearer {0}".format(key)}
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.get(url, headers=headers)
    if res.status_code >= 400:
        raise RuntimeError(
            "Grist PARC {0} HTTP {1}: {2}".format(table_id, res.status_code, res.text[:300])
        )
    data = res.json()
    return data.get("records") or []


async def _ensure_cache(force: bool = False) -> None:
    now = time.time()
    if (
        not force
        and _cache["produits"]
        and (now - float(_cache["fetched_at"])) < CACHE_TTL_SEC
    ):
        return

    produits_raw, defs_raw, rh_raw, parents_raw = (
        await _grist_records("Produits_DNUM"),
        await _grist_records("Definition_champs_complet"),
        await _grist_records("Base_RH"),
        await _grist_records("Produits_DNUM_parent"),
    )

    glossary: Dict[str, Dict[str, Any]] = {}
    for rec in defs_raw:
        fields = rec.get("fields") or {}
        tech = (fields.get("Nom_technique") or "").strip()
        if not tech:
            continue
        mapped = COLUMN_ALIASES.get(tech, tech)
        cat = fields.get("categorie") or ""
        if any(m.lower() in str(cat) for m in ADMIN_CATEGORY_MARKERS):
            continue
        pmd = str(fields.get("Priorite_Marine_Direction") or "")
        if "supprim" in pmd.lower():
            continue
        entry = {
            "label": (fields.get("label_affichage") or _label_from_key(mapped)).strip(),
            "category": str(cat).strip(),
            "priority": str(fields.get("priorite") or "").strip(),
            "definition": str(fields.get("definition") or "").strip(),
        }
        glossary[mapped] = entry
        if tech != mapped:
            glossary[tech] = entry

    rh: Dict[int, str] = {}
    for rec in rh_raw:
        rid = rec.get("id")
        fields = rec.get("fields") or {}
        name = (fields.get("Nom_et_Prenom") or "").strip()
        if isinstance(rid, int) and name:
            rh[rid] = name

    parents: Dict[int, str] = {}
    for rec in parents_raw:
        rid = rec.get("id")
        fields = rec.get("fields") or {}
        name = (fields.get("Nom_du_groupe") or "").strip()
        if isinstance(rid, int) and name:
            parents[rid] = name

    _cache["fetched_at"] = now
    _cache["produits"] = produits_raw
    _cache["glossary"] = glossary
    _cache["rh"] = rh
    _cache["parents"] = parents


def _tokens(question: str) -> List[str]:
    norm = _normalize(question)
    parts = re.findall(r"[a-z0-9][a-z0-9+./_-]*", norm)
    return [p for p in parts if p not in PRODUCT_STOPWORDS and len(p) >= 2]


def _has_phrase(haystack: str, needle: str) -> bool:
    """Match sur frontières de mots (évite que « DSN » gagne sur « DSN BDD »)."""
    if not needle:
        return False
    if haystack == needle:
        return True
    # Autoriser ponctuation après le nom (virgule, point d’interrogation, etc.)
    return (
        re.search(
            r"(?:^|[^a-z0-9+./_-])" + re.escape(needle) + r"(?:[^a-z0-9+./_-]|$)",
            haystack,
        )
        is not None
    )


def _score_product(question_norm: str, tokens: List[str], name: str, code: str) -> float:
    name_n = _normalize(name)
    code_n = _normalize(code)
    if not name_n and not code_n:
        return 0.0
    score = 0.0
    # Bonus longueur : favoriser le libellé le plus spécifique
    specificity = min(len(name_n), 40) * 0.35
    if name_n and _has_phrase(question_norm, name_n):
        score += 100.0 + specificity
    if code_n and _has_phrase(question_norm, code_n):
        score += 90.0 + min(len(code_n), 40) * 0.2
    if name_n and question_norm in name_n and len(question_norm) >= 3:
        score += 40.0
    name_tokens = set(name_n.split())
    for t in tokens:
        if t == code_n:
            score += 50.0
        elif t in name_tokens:
            score += 12.0
        elif t in name_n and len(t) >= 4:
            score += 8.0
        elif name_n.startswith(t) or t.startswith(name_n[: max(3, len(t))]):
            score += 6.0
    return score


def match_product(
    question: str, produits: List[Dict[str, Any]]
) -> Dict[str, Any]:
    tokens = _tokens(question)
    qn = _normalize(question)
    if not tokens and len(qn) < 2:
        return {
            "status": "need_product",
            "hint": "Précisez le nom du produit (tel qu’il apparaît dans Le PARC).",
        }

    scored: List[Tuple[float, Dict[str, Any], str]] = []
    for rec in produits:
        fields = rec.get("fields") or {}
        name = str(fields.get("Produit") or "").strip()
        code = str(fields.get("code") or "").strip()
        sc = _score_product(qn, tokens, name, code)
        if sc > 0:
            scored.append((sc, rec, name or code or "#{0}".format(rec.get("id"))))

    if not scored:
        return {
            "status": "not_found",
            "hint": "Aucun produit visible ne correspond à ce nom. Vérifiez l’orthographe dans Le PARC.",
        }

    # Si un libellé plus long matche en phrase entière, rétrograder les préfixes courts
    # (ex. « DSN » vs « DSN BDD » dans la même question).
    demoted: List[Tuple[float, Dict[str, Any], str]] = []
    for sc, rec, label in scored:
        ln = _normalize(label)
        penalty = 0.0
        for sc2, _rec2, label2 in scored:
            ln2 = _normalize(label2)
            if ln2 != ln and ln2.startswith(ln + " ") and _has_phrase(qn, ln2):
                penalty = max(penalty, 160.0)
        demoted.append((sc - penalty, rec, label))
    scored = demoted

    scored.sort(key=lambda x: (-x[0], -len(x[2]), x[2].lower()))
    best = scored[0][0]
    top = [s for s in scored if s[0] >= best * 0.85 and s[0] >= 12]
    if len(top) > 1 and top[0][0] < 90:
        # Ambigu if several close matches and no exact-ish hit
        cands = []
        seen = set()
        for _, _, label in top[:8]:
            if label not in seen:
                seen.add(label)
                cands.append(label)
        if len(cands) > 1:
            return {
                "status": "ambiguous",
                "hint": "Plusieurs produits correspondent. Précisez le nom un peu plus.",
                "candidates": cands,
            }

    # Prefer clear winner
    if best < 12:
        cands = [label for _, _, label in scored[:5]]
        return {
            "status": "ambiguous",
            "hint": "Plusieurs produits possibles. Précisez le nom.",
            "candidates": cands,
        }

    rec = scored[0][1]
    fields = rec.get("fields") or {}
    return {
        "status": "matched",
        "record": rec,
        "label": str(fields.get("Produit") or "").strip()
        or str(fields.get("code") or "").strip()
        or "Produit #{0}".format(rec.get("id")),
    }


def _priority_rank(priority: str) -> int:
    p = priority.lower()
    if "critique" in p:
        return 0
    if "important" in p:
        return 1
    return 2


def _detect_priority_category(question: str) -> Optional[str]:
    q = _normalize(question)
    for cat, hints in CATEGORY_HINTS:
        for h in hints:
            if _normalize(h) in q:
                return cat
    return None


def _category_sort_key(category: str, preferred: Optional[str]) -> Tuple[int, str]:
    cat_n = _normalize(category)
    if preferred and preferred.lower() in category:
        return (0, cat_n)
    # strip emoji prefixes roughly
    return (1, cat_n)


def build_product_facts(
    record: Dict[str, Any],
    question: str,
    glossary: Dict[str, Dict[str, Any]],
    rh: Dict[int, str],
    parents: Dict[int, str],
) -> Dict[str, Any]:
    fields_raw = record.get("fields") or {}
    preferred_cat = _detect_priority_category(question)

    field_items: List[Dict[str, Any]] = []
    present_keys = set()

    for key, raw in fields_raw.items():
        if key in EXCLUDE_KEYS:
            continue
        if _is_empty(raw):
            continue

        gloss = glossary.get(key) or {}
        label = gloss.get("label") or _label_from_key(key)
        category = gloss.get("category") or "Autres"

        if isinstance(raw, (int, float)) and not isinstance(raw, bool) and _looks_like_date_key(key):
            formatted = _format_date(raw)
            if formatted is None:
                continue
            value: Any = formatted
        else:
            value = _resolve_value(raw, rh)

        if "RGAA_Taux" in key or key == "RGAA_Taux_de_conformite":
            value = _format_rgaa_ratio(raw if isinstance(raw, (int, float)) and not isinstance(raw, bool) else value)

        truncated = False
        if isinstance(value, str):
            value, truncated = _truncate(value)

        item = {
            "key": key,
            "label": label,
            "category": category,
            "value": value,
        }
        if truncated:
            item["truncated"] = True
        if gloss.get("definition"):
            item["definition"] = gloss["definition"]
        field_items.append(item)
        present_keys.add(key)

    field_items.sort(
        key=lambda it: (
            _category_sort_key(it["category"], preferred_cat),
            _priority_rank((glossary.get(it["key"]) or {}).get("priority") or ""),
            _normalize(it["label"]),
        )
    )

    missing_critical: List[Dict[str, str]] = []
    candidate_cols = set(fields_raw.keys()) | set(COLUMN_ALIASES.values())
    for tech, gloss in glossary.items():
        col = COLUMN_ALIASES.get(tech, tech)
        if col not in candidate_cols:
            continue
        if col in present_keys:
            continue
        pri = gloss.get("priority") or ""
        if "Critique" not in pri and "Important" not in pri:
            continue
        raw = fields_raw.get(col)
        if raw is None and tech in fields_raw:
            raw = fields_raw.get(tech)
        if isinstance(raw, (int, float)) and not isinstance(raw, bool) and _looks_like_date_key(col):
            if _format_date(raw) is not None:
                continue
        elif not _is_empty(raw):
            continue
        missing_critical.append(
            {
                "key": col,
                "label": gloss.get("label") or _label_from_key(col),
                "priority": pri,
            }
        )

    # Dedupe missing by key
    seen_m = set()
    missing_dedup: List[Dict[str, str]] = []
    for m in missing_critical:
        if m["key"] in seen_m:
            continue
        seen_m.add(m["key"])
        missing_dedup.append(m)

    parent_ref = fields_raw.get("Produit_parent_reference")
    groupe = None
    if isinstance(parent_ref, int) and parent_ref in parents:
        groupe = parents[parent_ref]
    elif isinstance(parent_ref, list):
        ids = _unwrap_list(parent_ref)
        if isinstance(ids, list) and ids and isinstance(ids[0], int) and ids[0] in parents:
            groupe = parents[ids[0]]

    return {
        "tool": "parc_produit",
        "produit": str(fields_raw.get("Produit") or "").strip(),
        "code": str(fields_raw.get("code") or "").strip() or None,
        "groupeParent": groupe,
        "tauxCompletion": fields_raw.get("Taux_de_completion"),
        "preferredCategory": preferred_cat,
        "fields": field_items,
        "missingCritical": missing_dedup,
        "rule": (
            "Répondre uniquement avec ces faits. "
            "Si une info est absente de fields ou listée dans missingCritical, "
            "dire « non renseigné dans Le PARC ». "
            "Utiliser les libellés (label), jamais les clés techniques."
        ),
        "source": "Le PARC — Produits_DNUM (lecture)",
    }


def find_explicit_product_records(
    question: str, produits: List[Dict[str, Any]]
) -> List[Tuple[Dict[str, Any], str]]:
    """Produits dont le nom ou le code apparaît en phrase entière dans la question."""
    qn = _normalize(question)
    hits: List[Tuple[Dict[str, Any], str, str]] = []
    for rec in produits:
        fields = rec.get("fields") or {}
        name = str(fields.get("Produit") or "").strip()
        code = str(fields.get("code") or "").strip()
        name_n = _normalize(name)
        code_n = _normalize(code)
        label = name or code
        if not label:
            continue
        if name_n and _has_phrase(qn, name_n):
            hits.append((rec, label, name_n))
        elif code_n and _has_phrase(qn, code_n):
            hits.append((rec, label, code_n))

    # Garder le match le plus long si préfixe (DSN vs DSN BDD)
    filtered: List[Tuple[Dict[str, Any], str]] = []
    for rec, label, key in hits:
        dominated = False
        for _r2, _l2, key2 in hits:
            if key2 != key and key2.startswith(key + " "):
                dominated = True
                break
        if not dominated:
            filtered.append((rec, label))

    # Dédupliquer par label
    out: List[Tuple[Dict[str, Any], str]] = []
    seen = set()
    for rec, label in filtered:
        ln = _normalize(label)
        if ln in seen:
            continue
        seen.add(ln)
        out.append((rec, label))
    return out


async def resolve_parc_facts(question: str) -> Dict[str, Any]:
    if not parc_configured():
        return {
            "tool": "parc_produit",
            "unresolved": True,
            "reason": "not_configured",
            "hint": (
                "Le service d’essai n’a pas la configuration Grist PARC "
                "(GRIST_BASE_URL / GRIST_API_KEY / GRIST_DOC_ID_PARC)."
            ),
        }
    try:
        await _ensure_cache()
    except Exception as exc:  # noqa: BLE001 — surface as unresolved for the LLM
        return {
            "tool": "parc_produit",
            "unresolved": True,
            "reason": "load_error",
            "hint": "Impossible de lire Le PARC pour le moment ({0}).".format(type(exc).__name__),
        }

    explicit = find_explicit_product_records(question, _cache["produits"])
    if len(explicit) >= 2:
        products = []
        for rec, label in explicit[:4]:
            f = build_product_facts(
                rec,
                question,
                _cache["glossary"],
                _cache["rh"],
                _cache["parents"],
            )
            f["entityLabel"] = label
            products.append(f)
        return {
            "tool": "parc_produit_multi",
            "multi": True,
            "products": products,
            "entityLabel": " · ".join(p.get("produit") or p.get("entityLabel") or "" for p in products),
            "rule": (
                "Plusieurs produits sont fournis. Compare ou synthétise uniquement "
                "à partir de ces fiches. Ne pas inventer d’autres produits."
            ),
            "source": "Le PARC — Produits_DNUM (lecture multi)",
        }

    matched = match_product(question, _cache["produits"])
    status = matched["status"]
    if status != "matched":
        out: Dict[str, Any] = {
            "tool": "parc_produit",
            "unresolved": True,
            "reason": status,
            "hint": matched.get("hint") or "",
        }
        if matched.get("candidates"):
            out["candidates"] = matched["candidates"]
        return out

    facts = build_product_facts(
        matched["record"],
        question,
        _cache["glossary"],
        _cache["rh"],
        _cache["parents"],
    )
    facts["entityLabel"] = matched["label"]
    return facts


PARC_SYSTEM_PROMPT = (
    "Tu es l’assistant de lecture du référentiel **Le PARC** "
    "(produits / applications / communs numériques de la sous-direction). "
    "Tu réponds en français, clairement, sans jargon inutile. "
    "Tu n’inventes aucune information : tu utilises uniquement les **faits fournis** "
    "dans le contexte (champs avec libellés). "
    "Si les faits indiquent unresolved / not_found / ambiguous : "
    "explique-le clairement, cite le hint et les candidats s’ils sont fournis, "
    "et **ne** réponds **pas** « non renseigné » comme si le produit existait. "
    "Si une information manque (absente des faits ou listée dans missingCritical) "
    "pour un produit bien identifié, dis clairement « non renseigné dans Le PARC ». "
    "Si plusieurs produits sont fournis (multi), compare-les champ par champ "
    "sans inventer de valeurs. "
    "Quand on parle de besoins **DAT** ou **DICT**, ce sont les besoins "
    "Disponibilité, Intégrité, Confidentialité et Traçabilité "
    "(champs « Besoin DICT - … »). "
    "Pour un taux RGAA fourni en pourcentage, privilégie l’affichage en % "
    "(ex. 81 %), tu peux rappeler le ratio si utile. "
    "Cite les **libellés** métier, jamais les noms techniques de colonnes. "
    "Tu ne proposes pas de modifier Grist. "
    "Indique brièvement que la source est Le PARC (lecture)."
)
