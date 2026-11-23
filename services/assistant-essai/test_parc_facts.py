"""Tests unitaires matching / normalisation PARC (sans appel réseau)."""

from __future__ import annotations

import unittest

from parc_facts import (
    AGGREGATE_LIST_CAP,
    _as_rgaa_ratio,
    _format_rgaa_ratio,
    _is_empty,
    _normalize,
    _resolve_value,
    _score_product,
    _tokens,
    build_aggregate_facts,
    build_product_facts,
    detect_aggregate_intent,
    detect_department,
    facts_for_llm,
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

    def test_tokens_strip_trailing_punct(self) -> None:
        self.assertEqual(
            _tokens("Donne moi la note RGAA sur le produit Honorabilité."),
            ["honorabilite"],
        )

    def test_has_phrase_with_period(self) -> None:
        from parc_facts import _has_phrase

        q = _normalize("Donne moi la note RGAA sur le produit Honorabilité.")
        self.assertTrue(_has_phrase(q, "honorabilite"))

    def test_match_si_honorabilite_from_short_name(self) -> None:
        q = "Donne moi la note RGAA sur le produit Honorabilité"
        produits = [
            {"id": 1, "fields": {"Produit": "SI-Honorabilité", "code": ""}},
            {
                "id": 2,
                "fields": {
                    "Produit": "Base de données publique des médicaments",
                    "code": "",
                },
            },
        ]
        matched = match_product(q, produits)
        self.assertEqual(matched["status"], "matched")
        self.assertEqual(matched["label"], "SI-Honorabilité")
        self.assertGreaterEqual(
            _score_product(_normalize(q), _tokens(q), "SI-Honorabilité", ""),
            50.0,
        )

    def test_score_donne_not_donnees(self) -> None:
        q = _normalize("Donne moi le nombre de produits ayant le champ RGAA renseigné.")
        toks = _tokens("Donne moi le nombre de produits ayant le champ RGAA renseigné.")
        # « Donne » ne doit plus scorer sur « Base de données… »
        self.assertEqual(
            _score_product(q, toks, "Base de données publique des médicaments", ""),
            0.0,
        )
        # Honorabilité avec point final doit matcher en phrase
        q2 = _normalize("Donne moi la note RGAA sur le produit Honorabilité.")
        toks2 = _tokens("Donne moi la note RGAA sur le produit Honorabilité.")
        self.assertGreaterEqual(
            _score_product(q2, toks2, "Honorabilité", ""),
            100.0,
        )

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

    def test_cross_cue_aussi_alone_not_intersection(self) -> None:
        # Deux comptages séparés — ne doit pas devenir HDS ∩ obsolètes
        self.assertEqual(
            detect_aggregate_intent(
                "Combien de produits HDS et aussi combien d’obsolètes ?"
            ),
            "hds_count",
        )
        self.assertEqual(
            detect_aggregate_intent(
                "Combien de produits HDS qui sont aussi obsolètes ?"
            ),
            "hds_obsolete_count",
        )
        self.assertEqual(
            detect_aggregate_intent(
                "Parmi les produits HDS, lesquels sont obsolètes ?"
            ),
            "hds_obsolete_list",
        )

    def test_detect_departments_compare(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "Compare les effectifs GPS et SANTE : quel département a le plus gros parc ?"
            ),
            "departments_compare",
        )

    def test_detect_jdma_rgaa_list(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "Parmi les produits JDMA, lesquels ont un taux RGAA renseigné ?"
            ),
            "jdma_rgaa_list",
        )

    def test_detect_parc_risk_snapshot(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "Pour le pilotage : combien d’obsolètes, de criticité 1, HDS et PCA ?"
            ),
            "parc_risk_snapshot",
        )

    def test_build_hds_obsolete_count(self) -> None:
        produits = [
            {"fields": {"Produit": "A", "HDS": True, "Obsolescence": True}},
            {"fields": {"Produit": "B", "HDS": True, "Obsolescence": False}},
            {"fields": {"Produit": "C", "HDS": False, "Obsolescence": True}},
        ]
        facts = build_aggregate_facts("hds_obsolete_count", produits)
        self.assertEqual(facts["n_oui"], 1)

    def test_list_cap_criticite1(self) -> None:
        produits = [
            {"fields": {"Produit": "P{0:02d}".format(i), "Criticite": "1 - critique"}}
            for i in range(AGGREGATE_LIST_CAP + 5)
        ]
        facts = build_aggregate_facts("criticite1_list", produits)
        self.assertEqual(facts["n_oui"], AGGREGATE_LIST_CAP + 5)
        self.assertEqual(len(facts["produits"]), AGGREGATE_LIST_CAP)
        self.assertTrue(facts.get("liste_tronquee"))
        self.assertEqual(facts.get("n_affiches"), AGGREGATE_LIST_CAP)

    def test_facts_for_llm_strips_source(self) -> None:
        raw = {
            "tool": "parc_agregat",
            "source": "Le PARC — agrégat",
            "n_oui": 2,
            "products": [{"name": "A", "source": "x"}],
        }
        cleaned = facts_for_llm(raw)
        self.assertNotIn("source", cleaned)
        self.assertEqual(cleaned["n_oui"], 2)
        self.assertNotIn("source", cleaned["products"][0])


if __name__ == "__main__":
    unittest.main()
