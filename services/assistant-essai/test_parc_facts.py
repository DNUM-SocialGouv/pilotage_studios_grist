"""Tests unitaires matching / normalisation PARC (sans appel réseau)."""

from __future__ import annotations

import unittest

from parc_facts import (
    _as_rgaa_ratio,
    _format_rgaa_ratio,
    _is_empty,
    _normalize,
    _resolve_value,
    build_aggregate_facts,
    build_product_facts,
    detect_aggregate_intent,
    detect_department,
    find_explicit_product_records,
    match_product,
)


class ParcFactsTest(unittest.TestCase):
    def test_normalize_accents(self) -> None:
        self.assertEqual(_normalize("Accolade"), "accolade")
        self.assertEqual(_normalize("Hébergement"), "hebergement")
        self.assertEqual(_normalize("TDB IA DAT'IA"), "tdb ia dat ia")

    def test_format_rgaa_ratio(self) -> None:
        self.assertEqual(_format_rgaa_ratio(0.81), "81 % (ratio 0.81)")
        self.assertEqual(_format_rgaa_ratio(0.5082), "50.82 % (ratio 0.5082)")
        self.assertEqual(_format_rgaa_ratio(1), "100 % (ratio 1)")

    def test_is_empty(self) -> None:
        self.assertTrue(_is_empty(None))
        self.assertTrue(_is_empty(""))
        self.assertTrue(_is_empty(["L"]))
        self.assertFalse(_is_empty(False))
        self.assertFalse(_is_empty(0))
        self.assertFalse(_is_empty("ACCOLADE"))

    def test_resolve_rh(self) -> None:
        rh = {16: "DUPONT Marie"}
        self.assertEqual(_resolve_value(["L", 16], rh), ["DUPONT Marie"])
        self.assertEqual(_resolve_value(True, rh), "oui")

    def test_match_accolade(self) -> None:
        produits = [
            {"id": 2, "fields": {"Produit": "ACCOLADE", "code": "ACCOLADE"}},
            {"id": 3, "fields": {"Produit": "MARS - SI DEPOT", "code": "MARS-DEPOT"}},
        ]
        m = match_product("Quel hébergeur pour Accolade ?", produits)
        self.assertEqual(m["status"], "matched")
        self.assertEqual(m["label"], "ACCOLADE")

    def test_match_not_found(self) -> None:
        produits = [{"id": 1, "fields": {"Produit": "ACCOLADE", "code": "ACCOLADE"}}]
        m = match_product("Produit ZXQRTY inconnu total", produits)
        self.assertEqual(m["status"], "not_found")

    def test_match_prefers_longer_phrase(self) -> None:
        produits = [
            {"id": 1, "fields": {"Produit": "DSN", "code": "DSN"}},
            {"id": 2, "fields": {"Produit": "DSN BDD", "code": "DSN-BDD"}},
            {"id": 3, "fields": {"Produit": "DSN API", "code": "DSN-API"}},
        ]
        m = match_product("Quel est le taux RGAA de DSN BDD ?", produits)
        self.assertEqual(m["status"], "matched")
        self.assertEqual(m["label"], "DSN BDD")

    def test_find_explicit_multi(self) -> None:
        produits = [
            {"id": 1, "fields": {"Produit": "ACCOLADE", "code": "ACCOLADE"}},
            {"id": 2, "fields": {"Produit": "C2S", "code": "C2S"}},
            {"id": 3, "fields": {"Produit": "MANDOLINE", "code": "MANDOLINE"}},
        ]
        hits = find_explicit_product_records(
            "Compare Accolade et C2S sur l’hébergement", produits
        )
        labels = sorted(h[1] for h in hits)
        self.assertEqual(labels, ["ACCOLADE", "C2S"])

    def test_find_explicit_with_punctuation(self) -> None:
        produits = [
            {"id": 2, "fields": {"Produit": "C2S", "code": "C2S"}},
            {"id": 3, "fields": {"Produit": "MANDOLINE", "code": "MANDOLINE"}},
        ]
        hits = find_explicit_product_records(
            "Entre C2S et MANDOLINE, lequel a le meilleur taux RGAA ?",
            produits,
        )
        labels = sorted(h[1] for h in hits)
        self.assertEqual(labels, ["C2S", "MANDOLINE"])

    def test_build_facts_includes_bool_and_missing(self) -> None:
        record = {
            "id": 2,
            "fields": {
                "Produit": "ACCOLADE",
                "code": "ACCOLADE",
                "Monorepo": False,
                "Hebergement": ["L", "CEGEDIM"],
                "Departement_SDPC": "GPS",
                "UUID": "ignore-me",
                "RGAA_Taux_de_conformite": None,
            },
        }
        glossary = {
            "Hebergement": {
                "label": "Hébergement",
                "category": "4️⃣ Utilisateurs et Exploitation",
                "priority": "🔴 Critique",
                "definition": "Lieu d’hébergement",
            },
            "RGAA_Taux_de_conformite": {
                "label": "RGAA - Taux de conformité",
                "category": "3️⃣ Sécurité et Conformité",
                "priority": "🟠 Important",
                "definition": "Taux RGAA",
            },
            "Monorepo": {
                "label": "Monorepo",
                "category": "2️⃣ Architecture et Technologies",
                "priority": "🟢 Normal",
                "definition": "",
            },
        }
        facts = build_product_facts(record, "Quel hébergeur pour Accolade ?", glossary, {}, {})
        keys = {f["key"] for f in facts["fields"]}
        self.assertIn("Hebergement", keys)
        self.assertIn("Monorepo", keys)
        self.assertNotIn("UUID", keys)
        mono = next(f for f in facts["fields"] if f["key"] == "Monorepo")
        self.assertEqual(mono["value"], "non")
        missing_keys = {m["key"] for m in facts["missingCritical"]}
        self.assertIn("RGAA_Taux_de_conformite", missing_keys)

    def test_detect_aggregate_rgaa_mean(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "Donne moi la moyenne des taux de RGAA renseigné sur l’ensemble du parc"
            ),
            "rgaa_mean",
        )
        self.assertIsNone(detect_aggregate_intent("Quel est le taux RGAA de C2S ?"))

    def test_detect_aggregate_jdma_list(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                'liste moi les produits qui ont "Je Donne Mon Avis"'
            ),
            "jdma_list",
        )

    def test_build_aggregate_jdma_list(self) -> None:
        produits = [
            {"fields": {"Produit": "ACCOLADE", "Je_Donne_Mon_Avis": True}},
            {"fields": {"Produit": "C2S", "Je_Donne_Mon_Avis": False}},
            {"fields": {"Produit": "MANDOLINE", "Je_Donne_Mon_Avis": True}},
        ]
        facts = build_aggregate_facts("jdma_list", produits)
        self.assertEqual(facts["n_oui"], 2)
        self.assertEqual(facts["produits"], ["ACCOLADE", "MANDOLINE"])

    def test_detect_aggregate_hds_list(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "Quels sont les produits avec un environnement HDS ?"
            ),
            "hds_list",
        )

    def test_detect_department_gps(self) -> None:
        self.assertEqual(
            detect_department("Combien de produits dans le département GPS ?"),
            "GPS",
        )
        self.assertEqual(
            detect_aggregate_intent(
                "Quelle est la moyenne RGAA du département GPS ?"
            ),
            "rgaa_mean",
        )

    def test_build_aggregate_hds_list(self) -> None:
        produits = [
            {"fields": {"Produit": "AQUA-SISE", "HDS": True}},
            {"fields": {"Produit": "C2S", "HDS": False}},
            {"fields": {"Produit": "ONVS", "HDS": True}},
        ]
        facts = build_aggregate_facts("hds_list", produits)
        self.assertEqual(facts["n_oui"], 2)
        self.assertEqual(facts["produits"], ["AQUA-SISE", "ONVS"])

    def test_as_rgaa_ratio(self) -> None:
        self.assertEqual(_as_rgaa_ratio(0.81), 0.81)
        self.assertEqual(_as_rgaa_ratio(81), 0.81)
        self.assertIsNone(_as_rgaa_ratio(None))

    def test_build_aggregate_rgaa_mean(self) -> None:
        produits = [
            {"fields": {"RGAA_Taux_de_conformite": 0.8}},
            {"fields": {"RGAA_Taux_de_conformite": 0.6}},
            {"fields": {"RGAA_Taux_de_conformite": None}},
            {"fields": {}},
        ]
        facts = build_aggregate_facts("rgaa_mean", produits)
        self.assertEqual(facts["tool"], "parc_agregat")
        self.assertEqual(facts["n_renseignes"], 2)
        self.assertEqual(facts["total_produits"], 4)
        self.assertEqual(facts["moyenne_ratio"], 0.7)
        self.assertEqual(facts["moyenne_pourcent"], "70 %")


if __name__ == "__main__":
    unittest.main()
