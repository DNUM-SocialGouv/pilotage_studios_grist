"""
Outil faits PARC — lit Produits_DNUM (+ glossaire, Base_RH, parents) et construit
une fiche structurée pour LiteLLM. Lecture seule ; aucune invention côté modèle.
"""

from __future__ import annotations

import re
import time
import unicodedata
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

CACHE_TTL_SEC = 600
TEXT_MAX_CHARS = 4000
# Plafond des listes de noms produits injectées dans le prompt LiteLLM
AGGREGATE_LIST_CAP = 40
# Tableau affiché tel quel (sans passer par le modèle) : le parc tient largement dessous.
AGGREGATE_TABLE_CAP = 250

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
        "donne",  # « Donne moi… » ≠ sous-chaîne de « données »
        "moi",
        "note",
        "champ",
        "champs",
        "ayant",
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


def _md_cell(value: str) -> str:
    return str(value or "").replace("|", "\\|").replace("\n", " ").strip()


def format_aggregate_table_message(facts: Dict[str, Any]) -> Optional[str]:
    """
    Réponse tableau pour une liste demandée.
    Construit le Markdown à partir des faits : le modèle ne recopie pas les lignes.
    """
    if not isinstance(facts, dict) or facts.get("tool") != "parc_agregat":
        return None
    metric = str(facts.get("metric") or "")
    if not metric.endswith("_list"):
        return None

    detail = facts.get("produits_detail")
    lines: List[str] = []
    headers: List[str]
    if (
        isinstance(detail, list)
        and detail
        and isinstance(detail[0], dict)
        and "rgaa_pourcent" in detail[0]
    ):
        headers = ["Produit", "Taux de conformité RGAA"]
        for row in detail:
            if not isinstance(row, dict):
                continue
            name = _md_cell(str(row.get("produit") or ""))
            rate = _md_cell(str(row.get("rgaa_pourcent") or ""))
            if name:
                lines.append("| {0} | {1} |".format(name, rate))
    else:
        headers = ["Produit"]
        names = facts.get("produits") or []
        if isinstance(names, list):
            for name in names:
                cell = _md_cell(str(name))
                if cell:
                    lines.append("| {0} |".format(cell))

    label = str(facts.get("label") or "Liste")
    dept = str(facts.get("departement") or "").strip()
    scope = " — département {0}".format(dept) if dept else ""
    n = facts.get("n_oui")
    if n is None:
        n = facts.get("n_renseignes")
    total = facts.get("total_produits")

    if not lines:
        return "{0}{1} : aucun produit ne correspond.".format(label, scope)

    if isinstance(n, int) and isinstance(total, int):
        produit = "produit" if n == 1 else "produits"
        intro = "{0}{1} : {2} {3} sur {4} fiches.".format(
            label, scope, n, produit, total
        )
    else:
        intro = "{0}{1}.".format(label, scope)
    if facts.get("liste_tronquee"):
        intro += " Le tableau en montre {0}.".format(facts.get("n_affiches"))
    if metric == "rgaa_list" and isinstance(facts.get("n_non_renseignes"), int):
        missing = facts["n_non_renseignes"]
        if missing == 1:
            intro += " 1 fiche n’a pas de taux renseigné."
        else:
            intro += " {0} fiches n’ont pas de taux renseigné.".format(missing)

    header = "| " + " | ".join(headers) + " |"
    sep = "| " + " | ".join("---" for _ in headers) + " |"
    return intro + "\n\n" + "\n".join([header, sep, *lines])


def format_rgaa_threshold_message(facts: Dict[str, Any]) -> Optional[str]:
    """Phrase chiffrée pour un seuil RGAA, sans passer par le modèle."""
    if not isinstance(facts, dict) or facts.get("metric") != "rgaa_threshold":
        return None
    n = facts.get("n_oui")
    filled = facts.get("n_renseignes")
    total = facts.get("total_produits")
    if not isinstance(n, int) or not isinstance(filled, int) or not isinstance(total, int):
        return None
    produit = "produit a" if n == 1 else "produits ont"
    fiche = "fiche" if filled == 1 else "fiches"
    return (
        "{0} {1} un taux de conformité RGAA {2} {3}, "
        "sur {4} {5} où le taux est renseigné ({6} fiches au total)."
    ).format(
        n,
        produit,
        _RGAA_OP_LABEL.get(str(facts.get("comparaison") or ""), "supérieur ou égal à"),
        facts.get("seuil_pourcent") or "",
        filled,
        fiche,
        total,
    )


def format_dashboard_tile_message(facts: Dict[str, Any]) -> Optional[str]:
    """Phrase des tuiles du tableau de bord, sans le modèle."""
    if not isinstance(facts, dict):
        return None
    if facts.get("metric") == "completion_mean":
        percent = facts.get("moyenne_pourcent")
        total = facts.get("total_produits")
        filled = facts.get("n_renseignes")
        if not percent or not isinstance(total, int) or not isinstance(filled, int):
            return None
        return (
            "La complétion moyenne est de {0}, sur {1} fiches "
            "({2} taux renseignés)."
        ).format(percent, total, filled)
    n = facts.get("n_oui")
    total = facts.get("total_produits")
    if not isinstance(n, int) or not isinstance(total, int):
        return None
    dept = str(facts.get("departement") or "").strip()
    scope = " dans le département {0}".format(dept) if dept else ""
    metric = facts.get("metric")
    if metric == "strategique_count":
        verbe = "a" if n == 1 else "ont"
        return (
            "{0} produit{1} {2} le caractère stratégique renseigné{3}, "
            "sur {4} fiches. Une fiche compte dès qu’un choix est saisi, "
            "y compris « Non stratégique ». Le vide et le choix « N/A » ne comptent pas."
        ).format(n, "" if n == 1 else "s", verbe, scope, total)
    if metric == "a_completer_count":
        verbe = "a" if n == 1 else "ont"
        return (
            "{0} produit{1} {2} au moins une information critique manquante, "
            "ou un taux de complétion sous 50 %{3}, "
            "sur {4} fiches. C’est le décompte « produits à compléter » du tableau de bord."
        ).format(n, "" if n == 1 else "s", verbe, scope, total)
    phrase = _HOMOLOGATION_COUNT_PHRASES.get(str(metric or ""))
    if phrase is None:
        phrase = _MATURITY_COUNT_PHRASES.get(str(metric or ""))
    if phrase:
        produit = "produit" if n == 1 else "produits"
        accord = "" if n == 1 else "s"
        return phrase.format(n=n, produit=produit, scope=scope, total=total, s=accord)
    return None


# Phrases des tuiles Homologations. {n} {produit} … {scope}, sur {total} fiches.
_HOMOLOGATION_COUNT_PHRASES = {
    "homologues_count": (
        "Le tableau compte {n} {produit} homologué{s}{scope}, sur {total} fiches. "
        "Il retient les statuts qui parlent d’homologation, sauf « en cours ». "
        "« Homologation non engagée » est incluse."
    ),
    "homologation_en_cours_count": (
        "Le tableau compte {n} {produit} avec une homologation en cours{scope}, sur {total} fiches."
    ),
    "homologation_expiree_count": (
        "Le tableau compte {n} {produit} dont la fin de validité d’homologation est dépassée{scope}, "
        "sur {total} fiches."
    ),
    "homologation_3m_count": (
        "Le tableau compte {n} {produit} dont la fin de validité tombe dans les 90 prochains jours{scope}, "
        "sur {total} fiches. Les fins déjà dépassées ne sont pas comptées."
    ),
    "homologation_6m_count": (
        "Le tableau compte {n} {produit} dont la fin de validité tombe dans les 180 prochains jours{scope}, "
        "sur {total} fiches. Les fins déjà dépassées ne sont pas comptées."
    ),
    "homologation_sans_fin_count": (
        "Le tableau compte {n} {produit} sans date de fin d’homologation{scope}, sur {total} fiches."
    ),
    "homologation_non_renseigne_count": (
        "Le tableau compte {n} {produit} sans statut d’homologation{scope}, sur {total} fiches."
    ),
    "homologation_critiques_count": (
        "Le tableau compte {n} {produit} critique{s} ou essentiel{s} non homologué{s} "
        "ou à l’homologation dépassée{scope}, sur {total} fiches."
    ),
    "homologation_non_homologue_count": (
        "Le tableau compte {n} {produit} non homologué{s}{scope}, sur {total} fiches. "
        "« Homologation non engagée » reste du côté des homologués."
    ),
}

_HOMOLOGATION_LABELS = {
    "homologues": "Produits homologués",
    "homologation_en_cours": "Homologations en cours",
    "homologation_expiree": "Homologations expirées",
    "homologation_3m": "Échéance sous 3 mois",
    "homologation_6m": "Échéance sous 6 mois",
    "homologation_sans_fin": "Sans date de fin d’homologation",
    "homologation_non_renseigne": "Statut d’homologation non renseigné",
    "homologation_critiques": "Critiques non homologués ou expirés",
    "homologation_non_homologue": "Produits non homologués",
}

_MATURITY_COUNT_PHRASES = {
    "maturite_vision_count": (
        "Le tableau compte {n} {produit} sans vision et stratégie{scope}, sur {total} fiches."
    ),
    "maturite_design_count": (
        "Le tableau compte {n} {produit} sans connaissance utilisateurs et design{scope}, "
        "sur {total} fiches."
    ),
    "maturite_impact_count": (
        "Le tableau compte {n} {produit} sans mesure d’impact{scope}, sur {total} fiches."
    ),
    "maturite_delivery_count": (
        "Le tableau compte {n} {produit} sans delivery et itération{scope}, sur {total} fiches."
    ),
    "maturite_incomplete_count": (
        "Le tableau compte {n} {produit} à la maturité incomplète{scope}, sur {total} fiches. "
        "Il manque au moins une des quatre informations : vision et stratégie, "
        "connaissance utilisateurs, mesure d’impact, delivery et itération."
    ),
}

_MATURITY_LABELS = {
    "maturite_vision": "Sans vision et stratégie",
    "maturite_design": "Sans connaissance utilisateurs et design",
    "maturite_impact": "Sans mesure d’impact",
    "maturite_delivery": "Sans delivery et itération",
    "maturite_incomplete": "Maturité incomplète",
}


def format_aggregate_direct_message(facts: Dict[str, Any]) -> Optional[str]:
    """Réponse prête à afficher (tableau ou chiffre filtré), sinon None."""
    sentence = format_rgaa_threshold_message(facts)
    if sentence:
        return sentence
    sentence = format_dashboard_tile_message(facts)
    if sentence:
        return sentence
    return format_aggregate_table_message(facts)


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


def _choice_tags(value: Any) -> List[str]:
    """Valeurs d’un choix Grist, sans le marqueur de liste « L »."""
    if isinstance(value, str):
        raw: List[Any] = [value]
    elif isinstance(value, (list, tuple)):
        raw = list(value)
    else:
        return []
    tags: List[str] = []
    for item in raw:
        text = str(item).strip()
        if text and text != "L":
            tags.append(text)
    return tags


def _is_strategique_renseigne(fields: Dict[str, Any]) -> bool:
    """Colonne Produit stratégique saisie, hors vide et hors N/A.

    « Non stratégique » compte : le tableau de bord mesure la colonne remplie.
    """
    return any(_normalize(tag) != "n/a" for tag in _choice_tags(fields.get("Produit_strategique")))


def _critical_empty_count(fields: Dict[str, Any]) -> Optional[int]:
    raw = fields.get("Nombre_de_champs_critiques_vides")
    if isinstance(raw, (list, tuple)) and raw:
        raw = raw[0]
    if isinstance(raw, bool) or not isinstance(raw, (int, float)):
        return None
    return int(raw)


def _completion_scale(fields_list: List[Dict[str, Any]]) -> float:
    """1 si le taux est déjà en points (73), 100 s’il est un ratio (0,73)."""
    peak = 0.0
    for fields in fields_list:
        raw = fields.get("Taux_de_completion")
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            continue
        peak = max(peak, float(raw))
    return 100.0 if 0 < peak <= 1 else 1.0


def _completion_points(raw: Any, scale: float) -> Optional[int]:
    if isinstance(raw, bool) or not isinstance(raw, (int, float)):
        return None
    return _js_round(float(raw) * scale)


def _is_a_completer(fields: Dict[str, Any], scale: float = 1.0) -> bool:
    """Tuile « produits à compléter » : trou critique ou taux sous 50 %."""
    count = _critical_empty_count(fields)
    if count is not None and count > 0:
        return True
    points = _completion_points(fields.get("Taux_de_completion"), scale)
    return points is not None and points < 50


def _first_choice(value: Any) -> str:
    tags = _choice_tags(value)
    return tags[0] if tags else ""


def _as_widget_date(value: Any) -> Optional[date]:
    """Date lue comme le tableau de bord (jour calendaire)."""
    if value is None or value == "":
        return None
    if isinstance(value, (list, tuple)):
        tags = _choice_tags(value)
        if not tags:
            return None
        value = tags[0]
    if isinstance(value, str):
        text = value.strip()
        if text in ("0", "0.0"):
            return date(2000, 1, 1)
        try:
            return date.fromisoformat(text[:10])
        except ValueError:
            return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    n = float(value)
    if abs(n) >= 1e11:
        n = n / 1000.0
    try:
        return datetime.fromtimestamp(n, tz=timezone.utc).date()
    except (OverflowError, OSError, ValueError):
        return None


def _jours_restants(value: Any, today: date) -> Optional[int]:
    fin = _as_widget_date(value)
    if fin is None:
        return None
    return (fin - today).days


def _homologation_ok(fields: Dict[str, Any]) -> bool:
    """Tuile « produits homologués » : mot homologation, hors « en cours ».

    « Homologation non engagée » est incluse : la phrase ne commence pas par « non ».
    """
    status = _normalize(_first_choice(fields.get("Statut_d_homologation_de_securite")))
    return "homolog" in status and "en cours" not in status and not status.startswith("non")


def _homologation_en_cours(fields: Dict[str, Any]) -> bool:
    status = _normalize(_first_choice(fields.get("Statut_d_homologation_de_securite")))
    return "en cours" in status


def _critique_ou_essentiel(fields: Dict[str, Any]) -> bool:
    status = _normalize(_first_choice(fields.get("Criticite")))
    if status.startswith("non"):
        return False
    return "critique" in status or "essentiel" in status


def _homologation_matches(metric: str, fields: Dict[str, Any], today: date) -> bool:
    """Filtre d’une tuile Homologations. metric sans le suffixe _count / _list."""
    jours = _jours_restants(fields.get("Fin_de_validite_d_homologation"), today)
    if metric == "homologues":
        return _homologation_ok(fields)
    if metric == "homologation_en_cours":
        return _homologation_en_cours(fields)
    if metric == "homologation_expiree":
        return jours is not None and jours < 0
    if metric == "homologation_3m":
        return jours is not None and 0 <= jours <= 90
    if metric == "homologation_6m":
        return jours is not None and 0 <= jours <= 180
    if metric == "homologation_sans_fin":
        return jours is None
    if metric == "homologation_non_renseigne":
        return _first_choice(fields.get("Statut_d_homologation_de_securite")) == ""
    if metric == "homologation_critiques":
        return _critique_ou_essentiel(fields) and (
            not _homologation_ok(fields) or (jours is not None and jours < 0)
        )
    if metric == "homologation_non_homologue":
        return not _homologation_ok(fields)
    return False


_MATURITY_COLUMNS = {
    "maturite_vision": "Vision_strategie",
    "maturite_design": "Connaissance_utilisateurs_design",
    "maturite_impact": "Mesure_d_impact",
    "maturite_delivery": "Delivery_iteration",
}


def _js_round(value: float) -> int:
    """Arrondi du tableau de bord : 0,5 part vers le haut."""
    if value >= 0:
        return int(value + 0.5)
    return int(value - 0.5)


def _maturity_column_empty(fields: Dict[str, Any], column: str) -> bool:
    return not _choice_tags(fields.get(column))


def _maturity_incomplete(fields: Dict[str, Any]) -> bool:
    return any(_maturity_column_empty(fields, column) for column in _MATURITY_COLUMNS.values())


def _maturity_matches(metric: str, fields: Dict[str, Any]) -> bool:
    if metric == "maturite_incomplete":
        return _maturity_incomplete(fields)
    column = _MATURITY_COLUMNS.get(metric)
    return bool(column) and _maturity_column_empty(fields, column)


def _completion_mean_percent(fields_list: List[Dict[str, Any]]) -> Tuple[Optional[int], int]:
    """Moyenne du taux de complétion, arrondie comme le tableau (73 %)."""
    values: List[float] = []
    for fields in fields_list:
        raw = fields.get("Taux_de_completion")
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            continue
        values.append(float(raw))
    if not values:
        return None, 0
    scale = _completion_scale(fields_list)
    rounded = [_js_round(value * scale) for value in values]
    return _js_round(sum(rounded) / len(rounded)), len(rounded)


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
    # Pas de « . » collé en fin de token (« honorabilite. »)
    parts = re.findall(r"[a-z0-9][a-z0-9+/_-]*", norm)
    return [p for p in parts if p not in PRODUCT_STOPWORDS and len(p) >= 2]


def _has_phrase(haystack: str, needle: str) -> bool:
    """Match sur frontières de mots (évite que « DSN » gagne sur « DSN BDD »)."""
    if not needle:
        return False
    if haystack == needle:
        return True
    # Frontière = début/fin OU hors lettre/chiffre/+/_
    # Le tiret compte comme frontière (« Honorabilité » ⊂ « SI-Honorabilité »).
    # Le point final d’une phrase aussi.
    return (
        re.search(
            r"(?:^|[^a-z0-9+/_])" + re.escape(needle) + r"(?:[^a-z0-9+/_]|$)",
            haystack,
        )
        is not None
    )


def _name_parts(name_n: str) -> List[str]:
    """Découpe un libellé sur espaces / tirets (SI-Honorabilité → si, honorabilite)."""
    return [p for p in re.split(r"[\s\-_+/]+", name_n) if p]


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
    name_tokens = set(_name_parts(name_n))
    for t in tokens:
        if t == code_n:
            score += 50.0
        elif t in name_tokens:
            # Segment exact du libellé (ex. honorabilite dans SI-Honorabilité)
            score += 50.0 if len(t) >= 5 else 12.0
        elif len(t) >= 4 and _has_phrase(name_n, t):
            # Mot entier dans le libellé — pas de sous-chaîne (« donne » ⊂ « donnees »)
            score += 8.0
        elif name_n.startswith(t) and len(t) >= 4:
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

    # Scores faibles = bruit de matching (ex. mots de politesse), pas de vrais candidats
    if best < 12:
        return {
            "status": "not_found",
            "hint": (
                "Aucun produit ne correspond clairement à ce nom. "
                "Indiquez le libellé exact tel qu’il apparaît dans Le PARC."
            ),
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


_RGAA_THRESHOLD_OPS: List[Tuple[str, str]] = [
    (r">=|superieure? ou egal(?:e)?(?:\s+a)?|au moins|a partir de", "gte"),
    (r"<=|inferieure? ou egal(?:e)?(?:\s+a)?|au plus", "lte"),
    (r">|superieure?(?:\s+a)?|plus de|au dessus de", "gt"),
    (r"<|inferieure?(?:\s+a)?|moins de|en dessous de|au dessous de", "lt"),
    (r"egal(?:e)? a", "eq"),
]

_RGAA_OP_LABEL = {
    "gte": "supérieur ou égal à",
    "gt": "supérieur à",
    "lte": "inférieur ou égal à",
    "lt": "inférieur à",
    "eq": "égal à",
}


def parse_rgaa_threshold(question: str) -> Optional[Tuple[str, float]]:
    """
    Seuil sur le taux de conformité RGAA.
    « supérieur ou égal à 80 % » → ("gte", 0.8). None si pas de comparaison chiffrée.
    """
    q = _normalize(question)
    if "rgaa" not in q and "conformite" not in q:
        return None
    for pattern, op in _RGAA_THRESHOLD_OPS:
        match = re.search(
            r"(?:" + pattern + r")\s+(\d+(?:[.,]\d+)?)\s*(%|pour cent)?",
            q,
        )
        if not match:
            continue
        raw = float(match.group(1).replace(",", "."))
        has_percent = bool(match.group(2))
        if has_percent or raw > 1.0:
            if raw < 0 or raw > 100:
                return None
            return op, raw / 100.0
        if raw < 0:
            return None
        return op, raw
    return None


def _ratio_meets(ratio: float, op: str, seuil: float) -> bool:
    left = round(ratio * 100, 2)
    right = round(seuil * 100, 2)
    if op == "gte":
        return left >= right
    if op == "gt":
        return left > right
    if op == "lte":
        return left <= right
    if op == "lt":
        return left < right
    if op == "eq":
        return left == right
    return False


def _format_percent_ratio(ratio: float) -> str:
    pct = round(ratio * 100, 2)
    pct_s = str(int(pct)) if pct == int(pct) else str(pct)
    return "{0} %".format(pct_s)


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


def _detect_homologation_metric(question: str, list_ask: bool) -> Optional[str]:
    """Tuiles de l’onglet Homologations. None si la question vise une fiche."""
    q = _normalize(question)
    homolog = "homolog" in q
    if not homolog and "echeance" not in q and "expir" not in q:
        return None
    counting = list_ask or any(h in q for h in ("combien", "nombre", "quels", "lesquel"))
    tile = any(
        h in q
        for h in (
            "produits homolog",
            "homologations en cours",
            "homologations expir",
            "echeance sous",
            "sans date de fin",
            "non renseign",
            "non homolog",
        )
    )
    if not counting and not tile:
        return None
    want_list = list_ask or "quels" in q or "lesquel" in q

    def pack(name: str) -> str:
        return "{0}_{1}".format(name, "list" if want_list else "count")

    if homolog and "en cours" in q:
        return pack("homologation_en_cours")
    if homolog and ("sans date" in q or ("date de fin" in q and "sans" in q)):
        return pack("homologation_sans_fin")
    if homolog and "non renseign" in q:
        return pack("homologation_non_renseigne")
    if ("critique" in q or "essentiel" in q) and ("non homolog" in q or "expir" in q):
        return pack("homologation_critiques")
    if "non homolog" in q:
        return pack("homologation_non_homologue")
    if "expir" in q:
        return pack("homologation_expiree")
    if "6 mois" in q or "180 jour" in q:
        return pack("homologation_6m")
    if "3 mois" in q or "90 jour" in q:
        return pack("homologation_3m")
    if "homologu" in q and "non homolog" not in q:
        return pack("homologues")
    return None


def _named_product_question(question: str) -> bool:
    """« de C2S » vise une fiche. « des produits » vise le parc."""
    q = _normalize(question)
    if any(h in q for h in (" du parc", " des produit", " de produit", " les produit")):
        return False
    stops = {
        "la", "le", "les", "l", "fin", "validite", "bord", "conformite",
        "completion", "maturite", "vision", "strategie", "impact", "design",
    }
    tokens = re.findall(r"\bde ([a-z0-9][a-z0-9+/_-]*)", q)
    return any(token not in stops for token in tokens)


def _detect_maturity_metric(question: str, list_ask: bool) -> Optional[str]:
    """Tuiles Maturité et qualité. None si la question vise une fiche."""
    q = _normalize(question)
    if _named_product_question(q):
        return None
    incomplete = "maturite incomplete" in q or "donnees de maturite" in q
    mean = ("completion" in q or "completude" in q) and ("moyenne" in q or "moyen" in q)
    vision = "vision" in q and "strateg" in q
    design = "connaissance" in q and ("utilisateur" in q or "design" in q)
    impact = "mesure d impact" in q or ("impact" in q and "mesure" in q)
    delivery = "delivery" in q or ("iteration" in q and "delivery" in q)
    if not any((incomplete, mean, vision, design, impact, delivery)):
        return None
    counting = list_ask or any(h in q for h in ("combien", "nombre", "quels", "lesquel", "sans ", "pas de", "non renseign"))
    if not counting and not incomplete and not mean:
        return None
    want_list = list_ask or "quels" in q or "lesquel" in q

    def pack(name: str) -> str:
        return "{0}_{1}".format(name, "list" if want_list else "count")

    if incomplete:
        return pack("maturite_incomplete")
    if mean:
        return "completion_mean"
    if vision:
        return pack("maturite_vision")
    if design:
        return pack("maturite_design")
    if impact:
        return pack("maturite_impact")
    if delivery:
        return pack("maturite_delivery")
    return None


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
    if not (
        wide
        or statistical
        or list_ask
        or _detect_homologation_metric(question, list_ask)
        or _detect_maturity_metric(question, list_ask)
    ):
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

    threshold = parse_rgaa_threshold(question)
    if threshold and not (jdma and "rgaa" in q):
        asks_rows = any(
            h in q
            for h in (
                "liste",
                "lister",
                "tableau",
                "quels sont",
                "quels produits",
                "lesquels",
                "lesquelles",
            )
        )
        if "tableau de bord" in q:
            asks_rows = False
        return "rgaa_threshold_list" if asks_rows else "rgaa_threshold"

    if "rgaa" in q and ("moyenne" in q or "moyen" in q or "average" in q):
        return "rgaa_mean"
    # « liste / tableau / lesquels » prime sur « renseigné », sinon on ne renvoie qu’un décompte.
    explicit_enum = any(
        h in q
        for h in (
            "liste",
            "lister",
            "tableau",
            "quels sont",
            "quels produits",
            "quelles applications",
            "lesquels",
            "lesquelles",
            "enumer",
        )
    )
    if "tableau de bord" in q:
        explicit_enum = False
    if "rgaa" in q and explicit_enum:
        return "rgaa_list"
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
    homologation = _detect_homologation_metric(question, list_ask)
    if homologation:
        return homologation
    maturity = _detect_maturity_metric(question, list_ask)
    if maturity:
        return maturity
    if crit1 or ("critiques" in q and ("combien" in q or list_ask or "quels" in q)):
        if list_ask or "quels" in q:
            return "criticite1_list"
        return "criticite1_count"
    # Tuiles du tableau de bord. « à compléter » n’est pas le taux de complétion.
    a_completer = "a completer" in q
    strategic = "strategique" in q
    if a_completer and not strategic:
        if list_ask or "quels" in q:
            return "a_completer_list"
        return "a_completer_count"
    if strategic and not a_completer and (
        list_ask or "quels" in q or "combien" in q or "nombre" in q or wide
    ):
        if list_ask or "quels" in q:
            return "strategique_list"
        return "strategique_count"
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


def _is_list_followup(question: str) -> bool:
    """Relance du type « liste ces produits », sans nouveau critère."""
    q = _normalize(question)
    return any(
        h in q
        for h in (
            "liste",
            "lister",
            "lesquel",
            "montre",
            "detaille",
            "enumer",
            "cite les",
            "cite moi",
            "ces produit",
            "leur nom",
            "leurs nom",
            "noms des",
            "affiche",
        )
    )


_LIST_FROM_COUNT = {
    "rgaa_threshold": "rgaa_threshold_list",
    "rgaa_count": "rgaa_list",
    "rgaa_mean": "rgaa_list",
    "jdma_count": "jdma_list",
    "hds_count": "hds_list",
    "pca_count": "pca_list",
    "obsolescence_count": "obsolescence_list",
    "criticite1_count": "criticite1_list",
    "strategique_count": "strategique_list",
    "a_completer_count": "a_completer_list",
    "homologues_count": "homologues_list",
    "homologation_en_cours_count": "homologation_en_cours_list",
    "homologation_expiree_count": "homologation_expiree_list",
    "homologation_3m_count": "homologation_3m_list",
    "homologation_6m_count": "homologation_6m_list",
    "homologation_sans_fin_count": "homologation_sans_fin_list",
    "homologation_non_renseigne_count": "homologation_non_renseigne_list",
    "homologation_critiques_count": "homologation_critiques_list",
    "homologation_non_homologue_count": "homologation_non_homologue_list",
    "maturite_vision_count": "maturite_vision_list",
    "maturite_design_count": "maturite_design_list",
    "maturite_impact_count": "maturite_impact_list",
    "maturite_delivery_count": "maturite_delivery_list",
    "maturite_incomplete_count": "maturite_incomplete_list",
    "hds_obsolete_count": "hds_obsolete_list",
    "hds_criticite1_count": "hds_criticite1_list",
    "count_products": "department_list",
}


def _as_list_metric(metric: Optional[str]) -> Optional[str]:
    if not metric:
        return None
    if metric.endswith("_list"):
        return metric
    return _LIST_FROM_COUNT.get(metric)


def _single_department(
    question: str, criterion_question: str, inherited: bool
) -> Optional[str]:
    """Département du calcul. Une relance garde celui de la question d’avant."""
    departments = detect_departments(question)
    if inherited and not departments:
        departments = detect_departments(criterion_question)
    if len(departments) == 1:
        return departments[0]
    return None


def followup_list_metric(
    question: str, previous: Optional[str]
) -> Tuple[Optional[str], str]:
    """
    (métrique, question qui porte le critère).
    « Liste ces 40 produits » reprend le seuil de la question précédente.
    """
    own = detect_aggregate_intent(question)
    if own:
        return own, question
    if previous and _is_list_followup(question):
        inherited = _as_list_metric(detect_aggregate_intent(previous))
        if inherited:
            return inherited, previous
    return None, question


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
    rgaa_op: Optional[str] = None,
    rgaa_threshold: Optional[float] = None,
    today: Optional[date] = None,
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

    if metric in ("rgaa_threshold", "rgaa_threshold_list"):
        op = rgaa_op or "gte"
        seuil = 0.8 if rgaa_threshold is None else rgaa_threshold
        op_label = _RGAA_OP_LABEL.get(op, "supérieur ou égal à")
        seuil_label = _format_percent_ratio(seuil)
        rows = []
        n_filled = 0
        for fields in fields_list:
            ratio = _as_rgaa_ratio(fields.get("RGAA_Taux_de_conformite"))
            if ratio is None:
                continue
            n_filled += 1
            if not _ratio_meets(ratio, op, seuil):
                continue
            name = _product_name(fields)
            if not name:
                continue
            rows.append(
                {
                    "produit": name,
                    "rgaa_pourcent": _format_percent_ratio(ratio),
                }
            )
        rows.sort(key=lambda r: _normalize(str(r["produit"])))
        n = len(rows)
        label = "Produits avec un taux de conformité RGAA {0} {1}".format(
            op_label, seuil_label
        )
        base: Dict[str, Any] = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": label,
            "comparaison": op,
            "seuil_ratio": round(seuil, 4),
            "seuil_pourcent": seuil_label,
            "total_produits": total,
            "n_oui": n,
            "n_renseignes": n_filled,
            "n_non_renseignes": total - n_filled,
            "part_pourcent": _pct(n, n_filled),
            "rule": (
                "Annonce n_oui : produits dont le taux RGAA renseigné respecte le seuil. "
                "Rappelle n_renseignes et total_produits. "
                "Les fiches sans taux ne comptent pas dans n_oui. Ne liste pas les produits."
            ),
            "source": "Le PARC — agrégat RGAA filtré (lecture)",
        }
        if metric == "rgaa_threshold_list":
            truncated = n > AGGREGATE_TABLE_CAP
            shown = rows[:AGGREGATE_TABLE_CAP] if truncated else rows
            base["produits_detail"] = shown
            base["produits"] = [r["produit"] for r in shown]
            base["rule"] = (
                "Le tableau est ajouté par le service. "
                "Ne recopie pas les lignes et n’invente aucun taux."
            )
            if truncated:
                base["liste_tronquee"] = True
                base["n_affiches"] = AGGREGATE_TABLE_CAP
        return base

    if metric == "rgaa_list":
        rows = []
        for fields in fields_list:
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
                }
            )
        rows.sort(key=lambda r: _normalize(str(r["produit"])))
        n = len(rows)
        truncated = n > AGGREGATE_TABLE_CAP
        shown = rows[:AGGREGATE_TABLE_CAP] if truncated else rows
        out: Dict[str, Any] = {
            "tool": "parc_agregat",
            "metric": "rgaa_list",
            "label": "Produits avec un taux de conformité RGAA renseigné",
            "total_produits": total,
            "n_oui": n,
            "n_renseignes": n,
            "n_non_renseignes": total - n,
            "produits_detail": shown,
            "produits": [r["produit"] for r in shown],
            "rule": (
                "Le tableau est ajouté par le service. "
                "Ne recopie pas les lignes et n’invente aucun taux."
            ),
            "source": "Le PARC — liste RGAA_Taux_de_conformite (lecture)",
        }
        if truncated:
            out["liste_tronquee"] = True
            out["n_affiches"] = AGGREGATE_TABLE_CAP
        return out

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

    if metric in ("strategique_count", "strategique_list"):
        names = sorted(
            (
                _product_name(f)
                for f in fields_list
                if _is_strategique_renseigne(f) and _product_name(f)
            ),
            key=lambda s: _normalize(s),
        )
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": "Produits dont le caractère stratégique est renseigné",
            "total_produits": total,
            "n_oui": len(names),
            "part_pourcent": _pct(len(names), total),
            "rule": (
                "Compte les fiches dont Produit stratégique a un choix autre que vide ou N/A. "
                "« Non stratégique » compte. Annonce n_oui / total. "
                "Ne liste pas les produits, sauf si la métrique est une liste."
            ),
            "source": "Le PARC — agrégat Produit stratégique (lecture)",
        }
        if metric.endswith("_list"):
            base.update(_capped_names(names))
            base["rule"] = _list_rule(
                "Liste les noms fournis (caractère stratégique renseigné, hors N/A)."
            )
        return base

    if metric in ("a_completer_count", "a_completer_list"):
        names = sorted(
            (
                _product_name(f)
                for f in fields_list
                if _is_a_completer(f, _completion_scale(fields_list)) and _product_name(f)
            ),
            key=lambda s: _normalize(s),
        )
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": "Produits à compléter",
            "total_produits": total,
            "n_oui": len(names),
            "part_pourcent": _pct(len(names), total),
            "rule": (
                "Compte les fiches avec au moins un champ critique vide, "
                "ou un taux de complétion sous 50 %. "
                "Annonce n_oui / total. "
                "Ne liste pas les produits, sauf si la métrique est une liste."
            ),
            "source": "Le PARC — agrégat champs critiques vides (lecture)",
        }
        if metric.endswith("_list"):
            base.update(_capped_names(names))
            base["rule"] = _list_rule(
                "Liste les noms fournis (information critique manquante, ou taux sous 50 %)."
            )
        return base

    homologation_key = metric[: -len("_list")] if metric.endswith("_list") else (
        metric[: -len("_count")] if metric.endswith("_count") else ""
    )
    if homologation_key in (
        "homologues",
        "homologation_en_cours",
        "homologation_expiree",
        "homologation_3m",
        "homologation_6m",
        "homologation_sans_fin",
        "homologation_non_renseigne",
        "homologation_critiques",
        "homologation_non_homologue",
    ):
        as_of = today or date.today()
        names = sorted(
            (
                _product_name(f)
                for f in fields_list
                if _homologation_matches(homologation_key, f, as_of) and _product_name(f)
            ),
            key=lambda s: _normalize(s),
        )
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": _HOMOLOGATION_LABELS[homologation_key],
            "total_produits": total,
            "n_oui": len(names),
            "part_pourcent": _pct(len(names), total),
            "rule": (
                "Annonce n_oui / total. Ce décompte reprend la tuile du tableau de bord. "
                "Ne liste pas les produits, sauf si la métrique est une liste."
            ),
            "source": "Le PARC — agrégat homologation (lecture)",
        }
        if metric.endswith("_list"):
            base.update(_capped_names(names))
            base["rule"] = _list_rule("Liste les noms fournis pour cette tuile d’homologation.")
        return base

    if metric == "completion_mean":
        mean, filled = _completion_mean_percent(fields_list)
        return {
            "tool": "parc_agregat",
            "metric": "completion_mean",
            "label": "Complétion moyenne",
            "total_produits": total,
            "n_renseignes": filled,
            "moyenne_pourcent": None if mean is None else "{0} %".format(mean),
            "rule": "Annonce la moyenne arrondie du taux de complétion. Ne liste pas les produits.",
            "source": "Le PARC — agrégat complétion moyenne (lecture)",
        }

    maturity_key = metric[: -len("_list")] if metric.endswith("_list") else (
        metric[: -len("_count")] if metric.endswith("_count") else ""
    )
    if maturity_key in _MATURITY_LABELS:
        names = sorted(
            (
                _product_name(f)
                for f in fields_list
                if _maturity_matches(maturity_key, f) and _product_name(f)
            ),
            key=lambda s: _normalize(s),
        )
        base = {
            "tool": "parc_agregat",
            "metric": metric,
            "label": _MATURITY_LABELS[maturity_key],
            "total_produits": total,
            "n_oui": len(names),
            "part_pourcent": _pct(len(names), total),
            "rule": (
                "Annonce n_oui / total. Ce décompte reprend la tuile Maturité et qualité. "
                "Ne liste pas les produits, sauf si la métrique est une liste."
            ),
            "source": "Le PARC — agrégat maturité (lecture)",
        }
        if metric.endswith("_list"):
            base.update(_capped_names(names))
            base["rule"] = _list_rule("Liste les noms fournis pour cette tuile de maturité.")
        return base

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


async def resolve_parc_facts(
    question: str, previous_question: Optional[str] = None
) -> Dict[str, Any]:
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
    # Une relance « liste ces produits » reprend le critère de la question d’avant.
    aggregate, criterion_question = followup_list_metric(question, previous_question)
    inherited = bool(aggregate) and criterion_question != question
    explicit = (
        []
        if inherited
        else find_explicit_product_records(question, _cache["produits"])
    )
    if aggregate and len(explicit) == 0:
        departments = detect_departments(question)
        department = _single_department(question, criterion_question, inherited)
        if aggregate == "departments_compare":
            pool = _cache["produits"]
            facts = build_aggregate_facts(
                aggregate,
                pool,
                departments=departments or None,
            )
            return facts
        pool = _filter_produits_by_department(_cache["produits"], department)
        parsed_threshold = (
            parse_rgaa_threshold(criterion_question)
            if aggregate in ("rgaa_threshold", "rgaa_threshold_list")
            else None
        )
        facts = build_aggregate_facts(
            aggregate,
            pool,
            department=department,
            rgaa_op=parsed_threshold[0] if parsed_threshold else None,
            rgaa_threshold=parsed_threshold[1] if parsed_threshold else None,
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
