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
# Plafond des listes de noms produits injectées dans le prompt LiteLLM
AGGREGATE_LIST_CAP = 40

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


def facts_for_llm(facts: Any) -> Any:
    """Retire les clés « source » pour éviter le copier-coller « Source : Le PARC »."""
    if isinstance(facts, list):
        return [facts_for_llm(x) for x in facts]
    if not isinstance(facts, dict):
        return facts
    out: Dict[str, Any] = {}
    for key, val in facts.items():
        if key == "source":
            continue
        if key == "products" and isinstance(val, list):
            out[key] = [facts_for_llm(p) for p in val]
        else:
            out[key] = facts_for_llm(val) if isinstance(val, (dict, list)) else val
    return out


def _capped_names(names: List[str]) -> Dict[str, Any]:
    """Plafonne une liste de noms produits ; n_oui reste le total réel."""
    n = len(names)
    truncated = n > AGGREGATE_LIST_CAP
    payload: Dict[str, Any] = {
        "n_oui": n,
        "produits": names[:AGGREGATE_LIST_CAP] if truncated else names,
    }
    if truncated:
        payload["liste_tronquee"] = True
        payload["n_affiches"] = AGGREGATE_LIST_CAP
    return payload


def _list_rule(intro: str) -> str:
    return (
        "{0} Annonce n_oui. "
        "Si liste_tronquee=true, cite uniquement les n_affiches premiers noms fournis "
        "et précise que la liste est tronquée (total = n_oui). "
        "N’ajoute aucun autre produit."
    ).format(intro)


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


def _as_rgaa_ratio(value: Any) -> Optional[float]:
    """Normalise un taux RGAA stocké en ratio (0–1) ou en pourcentage (0–100)."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    v = float(value)
    if 0.0 <= v <= 1.0:
        return v
    if 1.0 < v <= 100.0:
        return v / 100.0
    return None


# Alias normalisés → valeur exacte Departement_SDPC
_DEPARTMENT_ALIASES: List[Tuple[str, str]] = [
    ("sdcid/dia", "SDCID/DIA"),
    ("sdcid dia", "SDCID/DIA"),
    ("sdcid/ma", "SDCID/MA"),
    ("sante", "SANTE"),
    ("gps", "GPS"),
    ("idn", "IDN"),
    ("spot", "SPOT"),
    ("spc", "SPC"),
]


def detect_departments(question: str) -> List[str]:
    """Tous les départements SDPC cités (ordre de mention)."""
    q = _normalize(question)
    has_dept_word = "departement" in q or "dept" in q
    found: List[str] = []
    for alias, canon in _DEPARTMENT_ALIASES:
        if alias not in q:
            continue
        if len(alias) <= 4 and not has_dept_word:
            if not re.search(
                r"(?:^|[^a-z0-9])" + re.escape(alias) + r"(?:[^a-z0-9]|$)", q
            ):
                continue
            if alias in ("idn", "spot", "spc", "gps") and not has_dept_word:
                # Autoriser les codes courts s’ils sont clairement listés à plusieurs
                if q.count("departement") == 0 and not any(
                    a in q for a in ("compare", "effectifs", "face a", "plus gros")
                ):
                    continue
        if canon not in found:
            found.append(canon)
    return found


def detect_department(question: str) -> Optional[str]:
    """Repère un département SDPC cité (ex. GPS, SANTE, SDCID/DIA)."""
    found = detect_departments(question)
    return found[0] if found else None


def detect_aggregate_intent(question: str) -> Optional[str]:
    """
    Questions sur l’ensemble du parc (moyenne, comptages) — pas une fiche produit.
    Si un nom de produit est clairement cité, on laisse le matching produit gagner.
    """
    q = _normalize(question)
    if not q:
        return None

    dept = detect_department(question)
    wide = any(
        h in q
        for h in (
            "ensemble du parc",
            "tout le parc",
            "tous les produits",
            "toutes les applications",
            "sur le parc",
            "du parc",
            "au total",
            "globalement",
            "en moyenne",
            "la moyenne",
            "moyenne des",
            "moyenne du",
            "combien de produits",
            "nombre de produits",
            "combien y a",
            "part des produits",
            "pourcentage de produits",
            "quel pourcentage",
        )
    ) or bool(dept)
    statistical = any(
        h in q
        for h in (
            "moyenne",
            "moyen ",
            "combien",
            "nombre de",
            "pourcentage",
            "part des",
            "taux moyen",
        )
    )
    list_ask = any(
        h in q
        for h in (
            "liste",
            "lister",
            "quels sont les produits",
            "quelles sont les",
            "quels produits",
            "quelles applications",
            "produits qui",
            "produits ayant",
            "produits avec",
            "produits du departement",
            "produits de mon departement",
        )
    )
    list_ask = list_ask or any(
        h in q
        for h in (
            "parmi",
            "lesquels",
            "lesquelles",
            "a la fois",
            "qui sont aussi",
            "aussi marques",
            "aussi marqués",
        )
    )
    if not (wide or statistical or list_ask):
        return None

    jdma = any(h in q for h in ("jdma", "je donne mon avis", "jedonnemonavis"))
    obsolete = any(h in q for h in ("obsolete", "obsolètes", "obsolète", "obsolescence"))
    crit1 = any(
        h in q
        for h in (
            "criticite 1",
            "criticité 1",
            "service critique",
            "services critiques",
        )
    )
    # Pas de « aussi » seul : « combien HDS et aussi combien d’obsolètes » ≠ intersection
    cross_cue = any(
        h in q
        for h in (
            "parmi",
            "a la fois",
            "qui sont aussi",
            "aussi marques",
            "aussi marqués",
            "croisement",
            "intersection",
        )
    )

    depts = detect_departments(question)
    if len(depts) >= 2 and any(
        h in q
        for h in (
            "compare",
            "comparer",
            "effectifs",
            "face a",
            "plus gros",
            "le plus gros",
            "versus",
            " vs ",
        )
    ):
        return "departments_compare"

    risk_hits = sum(
        [
            1 if obsolete else 0,
            1 if crit1 else 0,
            1 if "hds" in q else 0,
            1 if ("pca" in q or "continuite" in q) else 0,
        ]
    )
    if risk_hits >= 3 and (
        "combien" in q or "pilotage" in q or "risque" in q or "quatre" in q
    ):
        return "parc_risk_snapshot"

    if dept and any(
        h in q
        for h in (
            "synthese",
            "vue d ensemble",
            "etat des lieux",
            "tableau de bord",
            "en un coup d oeil",
            "chiffres cles",
            "chiffres clés",
        )
    ):
        return "department_snapshot"

    # Croisements explicites (évite de confondre avec une synthèse multi-sujets)
    want_list = list_ask or "quels" in q or "lesquels" in q
    want_count = "combien" in q or "nombre" in q
    if "hds" in q and obsolete and cross_cue:
        # « combien … qui sont aussi » → count (pas liste)
        return (
            "hds_obsolete_count"
            if want_count and not ("quels" in q or "lesquels" in q or "liste" in q)
            else ("hds_obsolete_list" if want_list else "hds_obsolete_count")
        )
    if "hds" in q and crit1 and cross_cue:
        return (
            "hds_criticite1_count"
            if want_count and not ("quels" in q or "lesquels" in q or "liste" in q)
            else ("hds_criticite1_list" if want_list else "hds_criticite1_count")
        )
    if jdma and "rgaa" in q and (
        list_ask
        or "lesquels" in q
        or "parmi" in q
        or "a la fois" in q
        or "qui ont" in q
        or "inferieur" in q
        or "superieur" in q
        or "y en a" in q
    ):
        return "jdma_rgaa_list"

    if "rgaa" in q and ("moyenne" in q or "moyen" in q or "average" in q):
        return "rgaa_mean"
    if "rgaa" in q and any(
        h in q for h in ("combien", "nombre", "part", "pourcentage", "renseign")
    ):
        if any(h in q for h in ("produit", "parc", "renseign", "avec un taux", "ont un")):
            return "rgaa_count"
    if jdma and list_ask:
        return "jdma_list"
    if jdma and (
        wide or "combien" in q or "nombre" in q or "part" in q or "pourcentage" in q
    ):
        return "jdma_count"
    if "hds" in q and list_ask:
        return "hds_list"
    if "hds" in q and (wide or "combien" in q or "nombre" in q or "part" in q):
        return "hds_count"
    if ("pca" in q or "continuite" in q or "continuité" in q) and (
        wide or "combien" in q or "nombre" in q or "inscrit" in q or list_ask
    ):
        if list_ask or "quels" in q or "lesquels" in q:
            return "pca_list"
        return "pca_count"
    if obsolete:
        if list_ask:
            return "obsolescence_list"
        return "obsolescence_count"
    if crit1 or ("critiques" in q and ("combien" in q or list_ask or "quels" in q)):
        if list_ask or "quels" in q:
            return "criticite1_list"
        return "criticite1_count"
    if any(
        h in q
        for h in (
            "combien de produits",
            "nombre de produits",
            "combien y a-t-il de produits",
            "combien y a t il de produits",
            "taille du parc",
        )
    ):
        return "count_products"
    if dept and list_ask:
        return "department_list"
    if dept and ("combien" in q or "nombre" in q):
        return "count_products"
    if wide and "rgaa" in q:
        return "rgaa_mean"
    return None


def _filter_produits_by_department(
    produits: List[Dict[str, Any]], department: Optional[str]
) -> List[Dict[str, Any]]:
    if not department:
        return produits
    out: List[Dict[str, Any]] = []
    for rec in produits:
        fields = rec.get("fields") or {}
        if str(fields.get("Departement_SDPC") or "").strip() == department:
            out.append(rec)
    return out


def build_aggregate_facts(
    metric: str,
    produits: List[Dict[str, Any]],
    *,
    department: Optional[str] = None,
    departments: Optional[List[str]] = None,
) -> Dict[str, Any]:
    total = len(produits)
    fields_list = [(rec.get("fields") or {}) for rec in produits]

    def _product_name(fields: Dict[str, Any]) -> str:
        return str(fields.get("Produit") or fields.get("code") or "").strip()

    def _pct(n: int, d: int) -> Optional[float]:
        if d <= 0:
            return None
        return round(100.0 * n / d, 2)

    if metric == "departments_compare":
        targets = departments or ([] if not department else [department])
        rows = []
        for dep in targets:
            subset = [
                f
                for f in fields_list
                if str(f.get("Departement_SDPC") or "").strip() == dep
            ]
            rows.append({"departement": dep, "n_produits": len(subset)})
        rows_sorted = sorted(rows, key=lambda r: (-r["n_produits"], r["departement"]))
        return {
            "tool": "parc_agregat",
            "metric": "departments_compare",
            "label": "Comparaison d’effectifs par département",
            "departements": rows,
            "plus_gros": rows_sorted[0]["departement"] if rows_sorted else None,
            "rule": (
                "Compare les n_produits. Indique clairement le plus gros. "
                "Ne liste pas les produits."
            ),
            "source": "Le PARC — comparatif Departement_SDPC",
        }

    if metric == "count_products":
        return {
            "tool": "parc_agregat",
            "metric": "count_products",
            "label": "Nombre de produits dans Le PARC",
            "total_produits": total,
            "rule": (
                "Annonce uniquement ce total. Ne liste pas les produits. "
                "Précise que c’est le nombre de fiches Produits_DNUM visibles."
            ),
            "source": "Le PARC — agrégat Produits_DNUM (lecture)",
        }

    if metric == "rgaa_mean":
        ratios: List[float] = []
        for fields in fields_list:
            ratio = _as_rgaa_ratio(fields.get("RGAA_Taux_de_conformite"))
            if ratio is not None:
                ratios.append(ratio)
        n = len(ratios)
        mean = (sum(ratios) / n) if n else None
        mean_pct = round(mean * 100, 2) if mean is not None else None
        return {
            "tool": "parc_agregat",
            "metric": "rgaa_mean",
            "label": "Moyenne des taux RGAA renseignés",
            "total_produits": total,
            "n_renseignes": n,
            "n_non_renseignes": total - n,
            "moyenne_ratio": round(mean, 4) if mean is not None else None,
            "moyenne_pourcent": (
                "{0} %".format(
                    int(mean_pct) if mean_pct == int(mean_pct) else mean_pct
                )
                if mean_pct is not None
                else None
            ),
            "rule": (
                "La moyenne porte uniquement sur les fiches avec un taux RGAA renseigné "
                "(dénominateur = n_renseignes, pas total_produits). "
                "Annonce la moyenne en % et rappelle n_renseignes / total_produits. "
                "Ne liste pas les produits. N’invente pas d’autre moyenne."
            ),
            "source": "Le PARC — agrégat RGAA_Taux_de_conformite (lecture)",
        }

    if metric == "rgaa_count":
        n = sum(
            1
            for fields in fields_list
            if _as_rgaa_ratio(fields.get("RGAA_Taux_de_conformite")) is not None
        )
        return {
            "tool": "parc_agregat",
            "metric": "rgaa_count",
            "label": "Produits avec un taux RGAA renseigné",
            "total_produits": total,
            "n_renseignes": n,
            "n_non_renseignes": total - n,
            "part_pourcent": _pct(n, total),
            "rule": (
                "Donne n_renseignes sur total_produits (et la part en % si utile). "
                "Ne liste pas les produits."
            ),
            "source": "Le PARC — agrégat RGAA (lecture)",
        }

    if metric == "jdma_count":
        n = sum(1 for fields in fields_list if fields.get("Je_Donne_Mon_Avis") is True)
        return {
            "tool": "parc_agregat",
            "metric": "jdma_count",
            "label": "Produits sur Je Donne Mon Avis",
            "total_produits": total,
            "n_oui": n,
            "n_non_ou_vide": total - n,
            "part_pourcent": _pct(n, total),
            "rule": (
                "Compte uniquement Je_Donne_Mon_Avis = oui. "
                "Donne n_oui / total_produits. Ne liste pas les produits."
            ),
            "source": "Le PARC — agrégat Je_Donne_Mon_Avis (lecture)",
        }

    if metric == "jdma_list":
        names: List[str] = []
        for fields in fields_list:
            if fields.get("Je_Donne_Mon_Avis") is True:
                name = str(fields.get("Produit") or fields.get("code") or "").strip()
                if name:
                    names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        return {
            "tool": "parc_agregat",
            "metric": "jdma_list",
            "label": "Liste des produits sur Je Donne Mon Avis",
            "total_produits": total,
            **_capped_names(names),
            "rule": _list_rule(
                "Liste les noms fournis (Je Donne Mon Avis = oui)."
            ),
            "source": "Le PARC — liste Je_Donne_Mon_Avis (lecture)",
        }

    if metric == "hds_count":
        n = sum(1 for fields in fields_list if fields.get("HDS") is True)
        return {
            "tool": "parc_agregat",
            "metric": "hds_count",
            "label": "Produits marqués HDS",
            "total_produits": total,
            "n_oui": n,
            "part_pourcent": _pct(n, total),
            "rule": "Compte HDS = oui. Donne n_oui / total. Ne liste pas les produits.",
            "source": "Le PARC — agrégat HDS (lecture)",
        }

    if metric == "hds_list":
        names: List[str] = []
        for fields in fields_list:
            if fields.get("HDS") is True:
                name = str(fields.get("Produit") or fields.get("code") or "").strip()
                if name:
                    names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        return {
            "tool": "parc_agregat",
            "metric": "hds_list",
            "label": "Liste des produits marqués HDS",
            "total_produits": total,
            **_capped_names(names),
            "rule": _list_rule(
                "Liste les noms fournis (HDS = oui). HDS = hébergement de données de santé."
            ),
            "source": "Le PARC — liste HDS (lecture)",
        }

    if metric == "pca_count":
        n = 0
        for fields in fields_list:
            raw = fields.get("Inscription_au_PCA")
            if isinstance(raw, str) and _normalize(raw).startswith("oui"):
                n += 1
            elif raw is True:
                n += 1
        return {
            "tool": "parc_agregat",
            "metric": "pca_count",
            "label": "Produits inscrits au PCA",
            "total_produits": total,
            "n_oui": n,
            "part_pourcent": _pct(n, total),
            "rule": (
                "Compte les fiches dont Inscription_au_PCA indique oui. "
                "Donne n_oui / total. Ne liste pas les produits."
            ),
            "source": "Le PARC — agrégat Inscription_au_PCA (lecture)",
        }

    if metric == "obsolescence_count":
        n = sum(1 for fields in fields_list if fields.get("Obsolescence") is True)
        return {
            "tool": "parc_agregat",
            "metric": "obsolescence_count",
            "label": "Produits marqués obsolètes",
            "total_produits": total,
            "n_oui": n,
            "part_pourcent": _pct(n, total),
            "rule": "Compte Obsolescence = oui. Donne n_oui / total. Ne liste pas les produits.",
            "source": "Le PARC — agrégat Obsolescence (lecture)",
        }

    if metric == "obsolescence_list":
        names = []
        for fields in fields_list:
            if fields.get("Obsolescence") is True:
                name = str(fields.get("Produit") or fields.get("code") or "").strip()
                if name:
                    names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        return {
            "tool": "parc_agregat",
            "metric": "obsolescence_list",
            "label": "Liste des produits obsolètes",
            "total_produits": total,
            **_capped_names(names),
            "rule": _list_rule("Liste les noms fournis (Obsolescence = oui)."),
            "source": "Le PARC — liste Obsolescence (lecture)",
        }

    if metric == "criticite1_count":
        n = sum(
            1
            for fields in fields_list
            if str(fields.get("Criticite") or "").strip().startswith("1")
        )
        return {
            "tool": "parc_agregat",
            "metric": "criticite1_count",
            "label": "Produits en criticité 1 (service critique)",
            "total_produits": total,
            "n_oui": n,
            "part_pourcent": _pct(n, total),
            "rule": (
                "Compte les fiches dont Criticite commence par « 1 ». "
                "Donne n_oui / total. Ne liste pas les produits."
            ),
            "source": "Le PARC — agrégat Criticite (lecture)",
        }

    if metric == "criticite1_list":
        names = []
        for fields in fields_list:
            if str(fields.get("Criticite") or "").strip().startswith("1"):
                name = str(fields.get("Produit") or fields.get("code") or "").strip()
                if name:
                    names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        capped = _capped_names(names)
        return {
            "tool": "parc_agregat",
            "metric": "criticite1_list",
            "label": "Liste des produits en criticité 1",
            "total_produits": total,
            **capped,
            "rule": _list_rule("Liste les noms fournis (criticité 1)."),
            "source": "Le PARC — liste Criticite 1 (lecture)",
        }

    if metric == "department_list":
        names = []
        for fields in fields_list:
            name = str(fields.get("Produit") or fields.get("code") or "").strip()
            if name:
                names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        return {
            "tool": "parc_agregat",
            "metric": "department_list",
            "label": "Liste des produits du département",
            "total_produits": total,
            **_capped_names(names),
            "rule": _list_rule("Liste les noms fournis pour ce département."),
            "source": "Le PARC — liste par Departement_SDPC (lecture)",
        }

    if metric in ("hds_obsolete_list", "hds_obsolete_count"):
        names = [
            _product_name(f)
            for f in fields_list
            if f.get("HDS") is True and f.get("Obsolescence") is True and _product_name(f)
        ]
        names = sorted(set(names), key=lambda s: _normalize(s))
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": "Produits HDS et obsolètes",
            "total_produits": total,
            "n_oui": len(names),
            "rule": (
                "Croisement HDS = oui ET Obsolescence = oui. "
                "Annonce n_oui. N’invente aucun autre produit."
            ),
            "source": "Le PARC — croisement HDS × Obsolescence",
        }
        if metric.endswith("_list"):
            capped = _capped_names(names)
            base.update(capped)
            base["rule"] = _list_rule(
                "Croisement HDS = oui ET Obsolescence = oui. Liste les noms fournis."
            )
        return base

    if metric in ("hds_criticite1_list", "hds_criticite1_count"):
        names = [
            _product_name(f)
            for f in fields_list
            if f.get("HDS") is True
            and str(f.get("Criticite") or "").strip().startswith("1")
            and _product_name(f)
        ]
        names = sorted(set(names), key=lambda s: _normalize(s))
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": "Produits HDS en criticité 1",
            "total_produits": total,
            "n_oui": len(names),
            "rule": (
                "Croisement HDS = oui ET criticité 1. Annonce n_oui. "
                "N’invente aucun autre produit."
            ),
            "source": "Le PARC — croisement HDS × Criticite",
        }
        if metric.endswith("_list"):
            capped = _capped_names(names)
            base.update(capped)
            base["rule"] = _list_rule(
                "Croisement HDS = oui ET criticité 1. Liste les noms fournis."
            )
        return base

    if metric == "jdma_rgaa_list":
        rows = []
        for fields in fields_list:
            if fields.get("Je_Donne_Mon_Avis") is not True:
                continue
            ratio = _as_rgaa_ratio(fields.get("RGAA_Taux_de_conformite"))
            if ratio is None:
                continue
            name = _product_name(fields)
            if not name:
                continue
            pct = round(ratio * 100, 2)
            pct_s = str(int(pct)) if pct == int(pct) else str(pct)
            rows.append(
                {
                    "produit": name,
                    "rgaa_pourcent": "{0} %".format(pct_s),
                    "rgaa_ratio": round(ratio, 4),
                }
            )
        rows.sort(key=lambda r: _normalize(r["produit"]))
        n = len(rows)
        truncated = n > AGGREGATE_LIST_CAP
        shown = rows[:AGGREGATE_LIST_CAP] if truncated else rows
        out: Dict[str, Any] = {
            "tool": "parc_agregat",
            "metric": "jdma_rgaa_list",
            "label": "Produits JDMA avec taux RGAA renseigné",
            "total_produits": total,
            "n_oui": n,
            "produits_detail": shown,
            "produits": [r["produit"] for r in shown],
            "rule": _list_rule(
                "Liste chaque produit fourni avec son rgaa_pourcent "
                "(JDMA = oui ET taux RGAA renseigné)."
            ),
            "source": "Le PARC — croisement JDMA × RGAA",
        }
        if truncated:
            out["liste_tronquee"] = True
            out["n_affiches"] = AGGREGATE_LIST_CAP
        return out

    if metric == "department_snapshot":
        n_obs = sum(1 for f in fields_list if f.get("Obsolescence") is True)
        n_jdma = sum(1 for f in fields_list if f.get("Je_Donne_Mon_Avis") is True)
        n_hds = sum(1 for f in fields_list if f.get("HDS") is True)
        n_pca = 0
        for f in fields_list:
            raw = f.get("Inscription_au_PCA")
            if isinstance(raw, str) and _normalize(raw).startswith("oui"):
                n_pca += 1
            elif raw is True:
                n_pca += 1
        ratios = [
            r
            for r in (_as_rgaa_ratio(f.get("RGAA_Taux_de_conformite")) for f in fields_list)
            if r is not None
        ]
        n_crit1 = sum(
            1 for f in fields_list if str(f.get("Criticite") or "").strip().startswith("1")
        )
        mean = (sum(ratios) / len(ratios)) if ratios else None
        mean_pct = round(mean * 100, 2) if mean is not None else None
        return {
            "tool": "parc_agregat",
            "metric": "department_snapshot",
            "label": "Synthèse département",
            "total_produits": total,
            "n_obsoletes": n_obs,
            "n_jdma": n_jdma,
            "n_hds": n_hds,
            "n_pca": n_pca,
            "n_rgaa_renseignes": len(ratios),
            "moyenne_rgaa_pourcent": (
                "{0} %".format(
                    int(mean_pct) if mean_pct == int(mean_pct) else mean_pct
                )
                if mean_pct is not None
                else None
            ),
            "n_criticite_1": n_crit1,
            "hds_produits": _capped_names(
                sorted(
                    {
                        _product_name(f)
                        for f in fields_list
                        if f.get("HDS") is True and _product_name(f)
                    },
                    key=lambda s: _normalize(s),
                )
            )["produits"],
            "rule": (
                "Présente ces chiffres clés en tableau ou liste courte. "
                "Tu peux citer hds_produits s’ils sont peu nombreux. "
                "Ne liste pas tous les produits du département."
            ),
            "source": "Le PARC — synthèse département",
        }

    if metric == "pca_list":
        names = []
        for fields in fields_list:
            raw = fields.get("Inscription_au_PCA")
            ok = (isinstance(raw, str) and _normalize(raw).startswith("oui")) or raw is True
            if ok:
                name = _product_name(fields)
                if name:
                    names.append(name)
        names = sorted(set(names), key=lambda s: _normalize(s))
        return {
            "tool": "parc_agregat",
            "metric": "pca_list",
            "label": "Produits inscrits au PCA",
            "total_produits": total,
            **_capped_names(names),
            "rule": _list_rule("Liste les noms (Inscription_au_PCA = oui)."),
            "source": "Le PARC — liste PCA",
        }

    if metric == "parc_risk_snapshot":
        n_obs = sum(1 for f in fields_list if f.get("Obsolescence") is True)
        n_crit1 = sum(
            1 for f in fields_list if str(f.get("Criticite") or "").strip().startswith("1")
        )
        n_hds = sum(1 for f in fields_list if f.get("HDS") is True)
        n_pca = 0
        for f in fields_list:
            raw = f.get("Inscription_au_PCA")
            if isinstance(raw, str) and _normalize(raw).startswith("oui"):
                n_pca += 1
            elif raw is True:
                n_pca += 1
        return {
            "tool": "parc_agregat",
            "metric": "parc_risk_snapshot",
            "label": "Chiffres risques / conformité (parc)",
            "total_produits": total,
            "n_obsoletes": n_obs,
            "n_criticite_1": n_crit1,
            "n_hds": n_hds,
            "n_pca": n_pca,
            "rule": (
                "Donne clairement les quatre chiffres demandés. "
                "Pas de liste exhaustive de produits."
            ),
            "source": "Le PARC — synthèse risques",
        }

    return {
        "tool": "parc_agregat",
        "unresolved": True,
        "reason": "unknown_metric",
        "hint": "Agrégat non pris en charge pour cette question.",
        "metric": metric,
    }


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

    # Agrégats « ensemble du parc » / département avant le matching produit.
    explicit = find_explicit_product_records(question, _cache["produits"])
    aggregate = detect_aggregate_intent(question)
    if aggregate and len(explicit) == 0:
        departments = detect_departments(question)
        department = departments[0] if len(departments) == 1 else None
        if aggregate == "departments_compare":
            pool = _cache["produits"]
            facts = build_aggregate_facts(
                aggregate,
                pool,
                departments=departments or None,
            )
            return facts
        pool = _filter_produits_by_department(_cache["produits"], department)
        facts = build_aggregate_facts(
            aggregate, pool, department=department
        )
        if department:
            facts["departement"] = department
            facts["filtre"] = "Departement_SDPC = {0}".format(department)
            label = str(facts.get("label") or "")
            if label and department not in label:
                facts["label"] = "{0} — {1}".format(label, department)
            facts["rule"] = (
                str(facts.get("rule") or "")
                + " Précise que le calcul porte sur le département {0} "
                "({1} fiche(s) dans ce périmètre).".format(department, len(pool))
            ).strip()
        return facts

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
    "Si les faits sont un **agrégat** (tool parc_agregat : moyenne, comptages, listes "
    "filtrées, croisements), utilise uniquement ces chiffres (moyenne_pourcent, "
    "n_renseignes, total_produits, produits[], produits_detail[], departement, etc.). "
    "Rappelle le dénominateur et le filtre département s’il est fourni. "
    "Pour une liste fournie dans produits[] ou produits_detail[], énumère ces noms "
    "(avec le détail demandé : RGAA, etc.). "
    "Sinon ne liste pas les produits un par un. Ne demande pas de coller une fiche. "
    "Quand on parle de besoins **DAT** ou **DICT**, ce sont les besoins "
    "Disponibilité, Intégrité, Confidentialité et Traçabilité "
    "(champs « Besoin DICT - … »). "
    "Pour un taux RGAA fourni en pourcentage, privilégie l’affichage en % "
    "(ex. 81 %), tu peux rappeler le ratio si utile. "
    "Cite les **libellés** métier, jamais les noms techniques de colonnes. "
    "Tu ne proposes pas de modifier Grist. "
    "Ne termine **pas** ta réponse par « Source : Le PARC » ni une formule du même "
    "genre : l’interface l’indique déjà au-dessus de la conversation."
)
