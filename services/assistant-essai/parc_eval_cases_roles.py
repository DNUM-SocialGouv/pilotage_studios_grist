"""Batteries par rôle — questions croisées / détaillées (réalistes)."""

from __future__ import annotations

from typing import Any, Dict, List

_NO_SOURCE_FOOTER = [
    "source : le parc",
    "source: le parc",
    "*source : le parc",
]

# --- Chef de projet : fiche riche, multi-champs, comparaison ---
CASES_ROLE_CDP: List[Dict[str, Any]] = [
    {
        "id": "CDP1",
        "theme": "cdp-fiche-croisee",
        "question": (
            "Pour Accolade, donne-moi en une synthèse : le chef de produit, "
            "l’hébergeur / infogérant, si c’est HDS, la criticité, le statut "
            "d’homologation, et le taux RGAA s’il existe."
        ),
        "expect_product": "ACCOLADE",
        "expect_any": ["rachedi", "cegedim"],
        "expect_all_soft": ["homologation", "courant", "non renseign"],
        "expect_none": _NO_SOURCE_FOOTER + ["hds = oui", "hds: oui"],
        "oracle": "CDP Assia · Cegedim · pas HDS · crit. 3 · homolog en cours · RGAA vide",
    },
    {
        "id": "CDP2",
        "theme": "cdp-compare-dict-rgaa",
        "question": (
            "Compare Accolade et C2S sur deux axes seulement : "
            "besoin DICT de disponibilité, et taux RGAA (en %). "
            "Dis clairement lequel a l’exigence de dispo la plus forte."
        ),
        "expect_products": ["ACCOLADE", "C2S"],
        "expect_any": ["c2s", "4h"],
        "expect_all_soft": ["81", "non renseign", "jour"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "C2S dispo 4h > Accolade 1 jour · RGAA C2S 81 % · Accolade vide",
    },
    {
        "id": "CDP3",
        "theme": "cdp-mandoline-sensible",
        "question": (
            "MANDOLINE : département, criticité saisonnière, besoin DICT de "
            "confidentialité, disponibilité DICT, et taux RGAA en pourcentage. "
            "Signale si le RGAA est très bas."
        ),
        "expect_product": "MANDOLINE",
        "expect_any": ["gps", "tres sensibles", "très sensibles"],
        "expect_all_soft": ["saisonni", "4h", "0,83", "0.83", "0,8", "1 %"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "GPS · saisonnière oui · conf 4 · dispo 4h · RGAA ≈ 0,83 %",
    },
    {
        "id": "CDP4",
        "theme": "cdp-stack-livraison",
        "question": (
            "Accolade : frameworks front et back, monorepo ou non, "
            "prestataire de développement, mode de support, et présence JDMA "
            "(oui/non + lien stats s’il existe)."
        ),
        "expect_product": "ACCOLADE",
        "expect_any": ["react", "spring", "jira"],
        "expect_all_soft": ["interne", "oui", "jedonnemonavis"],
        "expect_none": _NO_SOURCE_FOOTER + ["monorepo : oui"],
        "oracle": "React/Spring · pas monorepo · Interne · JIRA · JDMA oui + lien",
    },
    {
        "id": "CDP5",
        "theme": "cdp-dict-complet-vs",
        "question": (
            "Sur les quatre besoins DICT (dispo, intégrité, conf, traçabilité), "
            "où Mandoline est-elle plus exigeante qu’Accolade ? "
            "Cite les niveaux pour les deux produits."
        ),
        "expect_products": ["ACCOLADE", "MANDOLINE"],
        "expect_any": ["confidentialite", "confidentialité", "tracabilite", "traçabilité"],
        "expect_all_soft": ["4", "opposabilite", "opposabilité", "tres sensibles"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "Mandoline conf 4 + traçab 4 vs Accolade 2/2/2/3",
    },
    {
        "id": "CDP6",
        "theme": "cdp-petp-exploit",
        "question": (
            "PETP : département, mode de support, inscription PCA, taux RGAA en %, "
            "et si Je Donne Mon Avis est activé."
        ),
        "expect_product": "PETP",
        "expect_any": ["referent", "référent", "81"],
        "expect_all_soft": ["sante", "pca", "non"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "SANTE · référent · PCA non · RGAA 81 % · JDMA non",
    },
]

# --- Manager : filtres département + croisements + synthèse ---
CASES_ROLE_MANAGER: List[Dict[str, Any]] = [
    {
        "id": "MGR1",
        "theme": "mgr-snapshot-gps",
        "question": (
            "Fais-moi une synthèse / chiffres clés du département GPS : "
            "nombre de produits, obsolètes, JDMA, HDS, PCA, "
            "taux RGAA renseignés et moyenne RGAA."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["22"],
        "expect_all_soft": ["6", "60", "gps"],
        "expect_none": _NO_SOURCE_FOOTER + ["416"],
        "oracle": "Snapshot GPS · 22 · JDMA 6 · moyenne ~60 % · 0 HDS",
    },
    {
        "id": "MGR2",
        "theme": "mgr-jdma-rgaa-gps",
        "question": (
            "Dans le département GPS, quels produits sont à la fois sur "
            "Je Donne Mon Avis et ont un taux RGAA renseigné ? "
            "Donne le nom et le pourcentage RGAA pour chacun."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["mandoline", "1j1s", "85", "75"],
        "expect_all_soft": ["honorabilite", "honorabilité", "aides jeunes"],
        "expect_none": _NO_SOURCE_FOOTER + ["accolade"],
        "oracle": "5 produits GPS JDMA∩RGAA (Accolade JDMA sans RGAA → hors liste)",
    },
    {
        "id": "MGR3",
        "theme": "mgr-snapshot-sante",
        "question": (
            "État des lieux / chiffres clés du département SANTE : "
            "effectif, obsolètes, HDS (avec les noms s’ils sont peu nombreux), "
            "JDMA, PCA, moyenne RGAA si disponible."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["57", "22"],
        "expect_all_soft": ["aqua-sise", "hopsyweb", "hds"],
        "expect_none": _NO_SOURCE_FOOTER + ["416"],
        "oracle": "Snapshot SANTE · 57 · 22 obs · 5 HDS nommés",
    },
    {
        "id": "MGR4",
        "theme": "mgr-compare-effectifs",
        "question": (
            "Compare les effectifs produits des départements GPS, SANTE et SDCID/DIA : "
            "combien chacun, et lequel est le plus gros ?"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["108", "sdcid"],
        "expect_all_soft": ["22", "57", "gps", "sante"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "DIA 108 > SANTE 57 > GPS 22",
    },
    {
        "id": "MGR5",
        "theme": "mgr-pca-gps",
        "question": (
            "Quels produits du département GPS sont inscrits au PCA ? "
            "S’il n’y en a que quelques-uns, liste-les."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["siapadd", "honorabilite", "honorabilité"],
        "expect_all_soft": ["orob"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "SIAPADD · SISE-EAUX OROB · SI-Honorabilité",
    },
    {
        "id": "MGR6",
        "theme": "mgr-obs-vs-effectif-sante",
        "question": (
            "Dans SANTE, quelle part des produits est obsolète ? "
            "Donne le nombre d’obsolètes, le total SANTE, et un ordre de grandeur en %."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["22", "57"],
        "expect_all_soft": ["38", "39", "%"],
        "expect_none": _NO_SOURCE_FOOTER + ["75"],
        "oracle": "22/57 ≈ 39 % (pas 75 parc)",
    },
]

# --- Direction : risques transverses, croisements HDS, pilotage ---
CASES_ROLE_DIRECTION: List[Dict[str, Any]] = [
    {
        "id": "DIR1",
        "theme": "dir-hds-obsolete",
        "question": (
            "Parmi les produits HDS du parc, lesquels sont aussi marqués obsolètes ? "
            "Liste les noms et le nombre."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["aqua-sise", "hopsyweb", "si-vss"],
        "expect_all_soft": ["3"],
        "expect_none": _NO_SOURCE_FOOTER + ["transparence-sante"],
        "oracle": "3 : AQUA-SISE, HOPSYWEB, SI-VSS (pas Transparence ni HOPSYWEB-2)",
    },
    {
        "id": "DIR2",
        "theme": "dir-hds-critique",
        "question": (
            "Quels produits sont à la fois HDS et en criticité 1 (service critique) ?"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["aqua-sise", "hopsyweb-2"],
        "expect_all_soft": ["2"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "AQUA-SISE · HOPSYWEB-2",
    },
    {
        "id": "DIR3",
        "theme": "dir-rgaa-vs-couverture",
        "question": (
            "Sur l’ensemble du parc : moyenne des taux RGAA renseignés, "
            "nombre de fiches avec taux, total de produits, et part approximative "
            "de fiches encore sans taux RGAA."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["48", "110", "416"],
        "expect_all_soft": ["306", "74", "%"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "48,72 % · 110 renseignés · 306 sans (~74 %)",
    },
    {
        "id": "DIR4",
        "theme": "dir-risque-triple",
        "question": (
            "Pour le pilotage risques : combien de produits obsolètes, "
            "combien en criticité 1, combien HDS, et combien inscrits au PCA ? "
            "Réponds avec les quatre chiffres clairement."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["75", "52", "5", "59"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "75 obs · 52 crit1 · 5 HDS · 59 PCA",
    },
    {
        "id": "DIR5",
        "theme": "dir-jdma-rgaa-qualite",
        "question": (
            "Sur les produits Je Donne Mon Avis qui ont un taux RGAA, "
            "y en a-t-il avec un RGAA inférieur à 10 % ? Si oui, lesquels et quel taux ?"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["mandoline"],
        "expect_all_soft": ["0,83", "0.83", "1 %", "0,8"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "MANDOLINE ≈ 0,83 % dans la liste JDMA∩RGAA",
    },
    {
        "id": "DIR6",
        "theme": "dir-perimetre-dia",
        "question": (
            "Compare les effectifs SDCID/DIA, SANTE et GPS : "
            "SDCID/DIA est-il le plus gros ? Donne les trois nombres."
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["108"],
        "expect_all_soft": ["57", "22", "oui"],
        "expect_none": _NO_SOURCE_FOOTER,
        "oracle": "Oui · DIA 108 > SANTE 57 > GPS 22",
    },
]
