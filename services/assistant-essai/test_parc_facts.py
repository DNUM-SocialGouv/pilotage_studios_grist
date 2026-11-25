"""Tests unitaires matching / normalisation PARC (sans appel réseau)."""

from __future__ import annotations

import unittest
from datetime import date

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
    format_aggregate_direct_message,
    format_aggregate_table_message,
    followup_list_metric,
    _single_department,
    match_product,
    parse_rgaa_threshold,
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

    def test_detect_rgaa_list_not_count(self) -> None:
        self.assertEqual(
            detect_aggregate_intent(
                "J'ai besoin de la liste des produits avec leur taux de conformité "
                "RGAA associé quand il a été renseigné"
            ),
            "rgaa_list",
        )
        self.assertEqual(
            detect_aggregate_intent(
                "Combien de produits ont un taux RGAA renseigné ?"
            ),
            "rgaa_count",
        )
        self.assertEqual(
            detect_aggregate_intent(
                "Donne moi le nombre de produits ayant le champ RGAA renseigné."
            ),
            "rgaa_count",
        )

    def test_build_and_format_rgaa_list_table(self) -> None:
        produits = [
            {"fields": {"Produit": "C2S", "RGAA_Taux_de_conformite": 0.81}},
            {"fields": {"Produit": "Accolade", "RGAA_Taux_de_conformite": None}},
            {"fields": {"Produit": "MANDOLINE", "RGAA_Taux_de_conformite": 0.0083}},
        ]
        facts = build_aggregate_facts("rgaa_list", produits)
        self.assertEqual(facts["n_renseignes"], 2)
        self.assertEqual(facts["n_non_renseignes"], 1)
        self.assertEqual(
            [row["produit"] for row in facts["produits_detail"]],
            ["C2S", "MANDOLINE"],
        )
        self.assertEqual(facts["produits_detail"][0]["rgaa_pourcent"], "81 %")
        message = format_aggregate_table_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("2 produits sur 3 fiches", message)
        self.assertIn("1 fiche n’a pas de taux renseigné", message)
        self.assertIn("| Produit | Taux de conformité RGAA |", message)
        self.assertIn("| C2S | 81 % |", message)
        self.assertNotIn("Accolade", message)

    def test_format_name_list_as_table(self) -> None:
        facts = build_aggregate_facts(
            "hds_list",
            [
                {"fields": {"Produit": "A|B", "HDS": True}},
                {"fields": {"Produit": "C2S", "HDS": False}},
            ],
        )
        message = format_aggregate_table_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("| Produit |", message)
        self.assertIn("| A\\|B |", message)
        self.assertIsNone(
            format_aggregate_table_message(
                {"tool": "parc_agregat", "metric": "rgaa_count", "n_renseignes": 1}
            )
        )

    def test_rgaa_threshold_at_least_80(self) -> None:
        question = (
            "nombre de produits ayant un taux de conformité "
            "supérieure ou egal à 80%"
        )
        self.assertEqual(detect_aggregate_intent(question), "rgaa_threshold")
        self.assertEqual(parse_rgaa_threshold(question), ("gte", 0.8))
        produits = [
            {"fields": {"Produit": "C2S", "RGAA_Taux_de_conformite": 0.81}},
            {"fields": {"Produit": "Pile", "RGAA_Taux_de_conformite": 0.8}},
            {"fields": {"Produit": "Bas", "RGAA_Taux_de_conformite": 0.79}},
            {"fields": {"Produit": "Vide", "RGAA_Taux_de_conformite": None}},
        ]
        facts = build_aggregate_facts(
            "rgaa_threshold",
            produits,
            rgaa_op="gte",
            rgaa_threshold=0.8,
        )
        self.assertEqual(facts["n_oui"], 2)
        self.assertEqual(facts["n_renseignes"], 3)
        self.assertEqual(facts["total_produits"], 4)
        message = format_aggregate_direct_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("2 produits ont un taux de conformité RGAA supérieur ou égal à 80 %", message)
        self.assertIn("3 fiches où le taux est renseigné", message)
        self.assertIn("4 fiches au total", message)
        self.assertIsNone(detect_aggregate_intent("Quel est le taux RGAA de C2S ?"))

    def test_followup_lists_previous_threshold(self) -> None:
        previous = (
            "Tu peux me sortir le nombre de produits ayant un taux de conformité "
            "supérieure ou egal à 80% ?"
        )
        follow = "Tu peux me lister ces 40 produits"
        metric, source = followup_list_metric(follow, previous)
        self.assertEqual(metric, "rgaa_threshold_list")
        self.assertEqual(source, previous)
        self.assertEqual(parse_rgaa_threshold(source), ("gte", 0.8))
        self.assertEqual(
            followup_list_metric("Quel est le taux RGAA de C2S ?", previous)[0],
            None,
        )

    def test_dashboard_strategique_et_a_completer(self) -> None:
        self.assertEqual(
            detect_aggregate_intent("Combien de produits stratégiques ?"),
            "strategique_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Combien de produits à compléter ?"),
            "a_completer_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Liste les produits à compléter"),
            "a_completer_list",
        )
        self.assertIsNone(
            detect_aggregate_intent("Quel est le caractère stratégique de C2S ?")
        )
        self.assertEqual(
            detect_aggregate_intent("Quelle est la complétion moyenne ?"),
            "completion_mean",
        )
        produits = [
            {"fields": {"Produit": "Vide", "Produit_strategique": None, "Nombre_de_champs_critiques_vides": 0}},
            {"fields": {"Produit": "NA", "Produit_strategique": ["L", "N/A"], "Nombre_de_champs_critiques_vides": 0}},
            {"fields": {"Produit": "Non", "Produit_strategique": ["L", "Non stratégique"], "Nombre_de_champs_critiques_vides": 2}},
            {"fields": {"Produit": "Top", "Produit_strategique": ["L", "Top 20"], "Nombre_de_champs_critiques_vides": 0}},
        ]
        strategic = build_aggregate_facts("strategique_count", produits)
        self.assertEqual(strategic["n_oui"], 2)
        message = format_aggregate_direct_message(strategic)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("2 produits ont le caractère stratégique renseigné", message)
        self.assertIn("Non stratégique", message)
        incomplete = build_aggregate_facts("a_completer_count", produits)
        self.assertEqual(incomplete["n_oui"], 1)
        incomplete_message = format_aggregate_direct_message(incomplete)
        self.assertIsNotNone(incomplete_message)
        assert incomplete_message is not None
        self.assertIn("1 produit a au moins une information critique manquante", incomplete_message)
        self.assertIn("produits à compléter", incomplete_message)
        doubles = [
            {"fields": {"Produit": "Même", "Nombre_de_champs_critiques_vides": 1}},
            {"fields": {"Produit": "Même", "Nombre_de_champs_critiques_vides": 4}},
        ]
        self.assertEqual(build_aggregate_facts("a_completer_count", doubles)["n_oui"], 2)
        metric, source = followup_list_metric(
            "Tu peux me lister ces produits",
            "Combien de produits stratégiques ?",
        )
        self.assertEqual(metric, "strategique_list")
        self.assertEqual(source, "Combien de produits stratégiques ?")

    def test_dashboard_homologation_tiles(self) -> None:
        today = date(2026, 11, 25)
        self.assertEqual(
            detect_aggregate_intent("Combien de produits homologués ?"),
            "homologues_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Homologations en cours"),
            "homologation_en_cours_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Échéance sous 3 mois"),
            "homologation_3m_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Échéance sous 6 mois"),
            "homologation_6m_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Combien de critiques non homologués ou expirés ?"),
            "homologation_critiques_count",
        )
        self.assertIsNone(
            detect_aggregate_intent("Quel est le statut d'homologation de C2S ?")
        )
        produits = [
            {
                "fields": {
                    "Produit": "Oui",
                    "Statut_d_homologation_de_securite": "Homologuée",
                    "Fin_de_validite_d_homologation": "2027-06-01",
                    "Criticite": "3 : Service courant",
                }
            },
            {
                "fields": {
                    "Produit": "NonEng",
                    "Statut_d_homologation_de_securite": "Homologation non engagée",
                    "Fin_de_validite_d_homologation": "2020-01-01",
                    "Criticite": "1 : Service critique",
                }
            },
            {
                "fields": {
                    "Produit": "Cours",
                    "Statut_d_homologation_de_securite": "Homologation en cours",
                    "Fin_de_validite_d_homologation": "2027-01-15",
                    "Criticite": "2 : Service essentiel",
                }
            },
            {
                "fields": {
                    "Produit": "Vide",
                    "Statut_d_homologation_de_securite": None,
                    "Fin_de_validite_d_homologation": None,
                    "Criticite": "1 : Service critique",
                }
            },
        ]
        facts = build_aggregate_facts("homologues_count", produits, today=today)
        self.assertEqual(facts["n_oui"], 2)
        message = format_aggregate_direct_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("2 produits homologués", message)
        self.assertIn("non engagée", message)
        self.assertEqual(
            build_aggregate_facts("homologation_en_cours_count", produits, today=today)["n_oui"],
            1,
        )
        self.assertEqual(
            build_aggregate_facts("homologation_expiree_count", produits, today=today)["n_oui"],
            1,
        )
        self.assertEqual(
            build_aggregate_facts("homologation_3m_count", produits, today=today)["n_oui"],
            1,
        )
        self.assertEqual(
            build_aggregate_facts("homologation_6m_count", produits, today=today)["n_oui"],
            1,
        )
        self.assertEqual(
            build_aggregate_facts("homologation_sans_fin_count", produits, today=today)["n_oui"],
            1,
        )
        self.assertEqual(
            build_aggregate_facts("homologation_non_renseigne_count", produits, today=today)["n_oui"],
            1,
        )
        # Non engagée expirée + en cours essentiel + critique sans statut
        self.assertEqual(
            build_aggregate_facts("homologation_critiques_count", produits, today=today)["n_oui"],
            3,
        )

    def test_dashboard_maturite(self) -> None:
        self.assertEqual(
            detect_aggregate_intent("Sans vision et stratégie"),
            "maturite_vision_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Combien de produits sans connaissance utilisateurs et design ?"),
            "maturite_design_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Sans mesure d'impact"),
            "maturite_impact_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Sans delivery et itération"),
            "maturite_delivery_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Maturité incomplète"),
            "maturite_incomplete_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Quelle est la complétion moyenne ?"),
            "completion_mean",
        )
        self.assertIsNone(
            detect_aggregate_intent("Quel est le niveau de vision et stratégie de C2S ?")
        )
        produits = [
            {
                "fields": {
                    "Produit": "Plein",
                    "Vision_strategie": "Niveau 2 - maîtrisé",
                    "Connaissance_utilisateurs_design": "Niveau 1 - en cours",
                    "Mesure_d_impact": "Niveau 0 - non adressé",
                    "Delivery_iteration": "Niveau 2 - maîtrisé",
                    "Taux_de_completion": 100,
                }
            },
            {
                "fields": {
                    "Produit": "Trou",
                    "Vision_strategie": None,
                    "Connaissance_utilisateurs_design": "Niveau 2 - maîtrisé",
                    "Mesure_d_impact": None,
                    "Delivery_iteration": None,
                    "Taux_de_completion": 50,
                }
            },
            {
                "fields": {
                    "Produit": "Vide",
                    "Vision_strategie": ["L"],
                    "Taux_de_completion": 46,
                }
            },
        ]
        self.assertEqual(build_aggregate_facts("maturite_vision_count", produits)["n_oui"], 2)
        self.assertEqual(build_aggregate_facts("maturite_design_count", produits)["n_oui"], 1)
        self.assertEqual(build_aggregate_facts("maturite_impact_count", produits)["n_oui"], 2)
        self.assertEqual(build_aggregate_facts("maturite_delivery_count", produits)["n_oui"], 2)
        self.assertEqual(build_aggregate_facts("maturite_incomplete_count", produits)["n_oui"], 2)
        mean = build_aggregate_facts("completion_mean", produits)
        self.assertEqual(mean["moyenne_pourcent"], "65 %")
        self.assertEqual(mean["n_renseignes"], 3)
        message = format_aggregate_direct_message(mean)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("65 %", message)

    def test_followup_keeps_previous_department(self) -> None:
        previous = "Combien de produits stratégiques dans le département GPS ?"
        follow = "Tu peux me lister ces produits"
        self.assertEqual(_single_department(follow, previous, True), "GPS")
        self.assertIsNone(_single_department(follow, previous, False))

    def test_a_completer_includes_low_completion(self) -> None:
        produits = [
            {
                "fields": {
                    "Produit": "Trou",
                    "Nombre_de_champs_critiques_vides": 2,
                    "Taux_de_completion": 80,
                }
            },
            {
                "fields": {
                    "Produit": "Bas",
                    "Nombre_de_champs_critiques_vides": 0,
                    "Taux_de_completion": 40,
                }
            },
            {
                "fields": {
                    "Produit": "Plein",
                    "Nombre_de_champs_critiques_vides": 0,
                    "Taux_de_completion": 80,
                }
            },
        ]
        self.assertEqual(build_aggregate_facts("a_completer_count", produits)["n_oui"], 2)

    def test_singular_and_non_homologue(self) -> None:
        self.assertEqual(
            detect_aggregate_intent("Combien de produits non homologués ?"),
            "homologation_non_homologue_count",
        )
        produits = [
            {"fields": {"Produit": "Oui", "Statut_d_homologation_de_securite": "Homologuée"}},
            {"fields": {"Produit": "Vide", "Statut_d_homologation_de_securite": None}},
        ]
        facts = build_aggregate_facts(
            "homologues_count",
            [produits[0]],
            today=date(2026, 11, 25),
        )
        message = format_aggregate_direct_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("1 produit homologué", message)
        self.assertNotIn("homologués", message)
        self.assertEqual(
            build_aggregate_facts(
                "homologation_non_homologue_count",
                produits,
                today=date(2026, 11, 25),
            )["n_oui"],
            1,
        )

    def test_homologation_echeance_annee(self) -> None:
        question = (
            "Donne moi la liste des produits dont l'homologation arrive à échéance en 2027"
        )
        self.assertEqual(detect_aggregate_intent(question), "homologation_annee_list")
        self.assertIsNone(
            detect_aggregate_intent("Quel est le statut d'homologation de C2S ?")
        )
        produits = [
            {
                "fields": {
                    "Produit": "SITE-LISTE-NOIRE",
                    "Fin_de_validite_d_homologation": "2026-04-01",
                }
            },
            {
                "fields": {
                    "Produit": "ACCOLADE",
                    "Fin_de_validite_d_homologation": "2027-03-15",
                }
            },
            {
                "fields": {
                    "Produit": "C2S",
                    "Fin_de_validite_d_homologation": "2027-11-02",
                }
            },
            {"fields": {"Produit": "SANS", "Fin_de_validite_d_homologation": None}},
        ]
        facts = build_aggregate_facts(
            "homologation_annee_list",
            produits,
            homologation_year=2027,
        )
        self.assertEqual(facts["n_oui"], 2)
        self.assertEqual(facts["produits"], ["ACCOLADE", "C2S"])
        message = format_aggregate_direct_message(facts)
        self.assertIsNotNone(message)
        assert message is not None
        self.assertIn("| Produit | Fin de validité |", message)
        self.assertIn("| ACCOLADE | 15/03/2027 |", message)
        self.assertNotIn("SITE-LISTE-NOIRE", message)
        count = build_aggregate_facts(
            "homologation_annee_count",
            produits,
            homologation_year=2027,
        )
        count_message = format_aggregate_direct_message(count)
        self.assertIsNotNone(count_message)
        assert count_message is not None
        self.assertIn("2 produits ont une fin de validité d’homologation en 2027", count_message)
        self.assertEqual(
            detect_aggregate_intent("Combien de produits non homologués en 2027 ?"),
            "homologation_annee_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Combien d'homologations en cours en 2027 ?"),
            "homologation_annee_count",
        )
        self.assertEqual(
            detect_aggregate_intent("Combien d'homologations en cours ?"),
            "homologation_en_cours_count",
        )
        previous = "Combien de produits ont une homologation à échéance en 2027 ?"
        metric, source = followup_list_metric("Tu peux me lister ces produits", previous)
        self.assertEqual(metric, "homologation_annee_list")
        self.assertEqual(source, previous)


if __name__ == "__main__":
    unittest.main()
