#!/usr/bin/env python3
"""Régénère src/data/parcUuidToRowId.ts depuis Le PARC (Produits_DNUM).

Lit GRIST_BASE_URL / GRIST_API_KEY / GRIST_DOC_ID_PARC depuis
services/assistant-essai/.env (ou l’environnement).

Usage (depuis la racine du dépôt) :
  python3 scripts/sync-parc-uuid-map.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "services" / "assistant-essai" / ".env"
OUT = ROOT / "src" / "data" / "parcUuidToRowId.ts"


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, _, v = s.partition("=")
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k, v)


def main() -> int:
    load_dotenv(ENV_PATH)
    base = os.environ.get("GRIST_BASE_URL", "").rstrip("/")
    key = os.environ.get("GRIST_API_KEY", "")
    doc = os.environ.get("GRIST_DOC_ID_PARC", "vjbmAgqvttQH")
    if not base or not key:
        print(
            "GRIST_BASE_URL et GRIST_API_KEY requis (services/assistant-essai/.env).",
            file=sys.stderr,
        )
        return 1
    url = f"{base}/docs/{doc}/tables/Produits_DNUM/records"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        recs = json.load(resp).get("records") or []
    mapping: dict[str, int] = {}
    for rec in recs:
        fields = rec.get("fields") or {}
        uuid = fields.get("UUID")
        rid = rec.get("id")
        if isinstance(uuid, str) and uuid.strip() and isinstance(rid, int):
            mapping[uuid.strip()] = rid
    if not mapping:
        print("Aucune entrée UUID → id.", file=sys.stderr)
        return 1
    lines = [
        "/**",
        " * UUID Produits_DNUM (Le PARC) → id de ligne Grist.",
        " * Généré — ne pas éditer à la main.",
        " * Régénérer : `python3 scripts/sync-parc-uuid-map.py` (nécessite services/assistant-essai/.env).",
        f" * Source : doc `{doc}` table `Produits_DNUM` ({len(mapping)} entrées).",
        " */",
        "export const PARC_UUID_TO_ROW_ID: Readonly<Record<string, number>> = {",
    ]
    for uuid, rid in sorted(mapping.items()):
        lines.append(f'  "{uuid}": {rid},')
    lines.append("};")
    lines.append("")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines))
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(mapping)} entries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
