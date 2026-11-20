"""Batteries de questions Assistant PARC (basic + complexe + rôles)."""

from __future__ import annotations

from typing import Any, Dict, List

from parc_eval_cases_roles import (
    CASES_ROLE_CDP,
    CASES_ROLE_DIRECTION,
    CASES_ROLE_MANAGER,
)

CASES_BASIC: List[Dict[str, Any]] = [
    {
        "id": "Q1",
        "theme": "hébergement",
        "question": "Quel est l’hébergeur de Accolade ?",
        "expect_any": ["cegedim"],
        "oracle": "Hebergement=CEGEDIM · Infogerant=Cegedim",
    },
    {
        "id": "Q2",
        "theme": "gouvernance",
        "question": "Quel département SDPC pour Accolade ?",
        "expect_any": ["gps"],
        "oracle": "Departement_SDPC=GPS",
    },
    {
        "id": "Q3",
        "theme": "techno",
        "question": "Accolade est-il en monorepo ?",
        "expect_any": ["non"],
        "expect_none": ["oui, accolade est en monorepo"],
        "oracle": "Monorepo=false",
    },
    {
        "id": "Q4",
        "theme": "manquant",
        "question": "Quel est le taux RGAA d’Accolade ?",
        "expect_any": [
            "non renseigne",
            "pas renseigne",
            "n'est pas renseigne",
            "non disponible",
            "absent",
        ],
        "expect_none": ["75 %", "0,75", "81 %"],
        "oracle": "RGAA_Taux_de_conformite vide → non renseigné",
    },
    {
        "id": "Q5",
        "theme": "personnes",
        "question": "Qui est le chef de produit d’Accolade ?",
        "expect_any": ["rachedi", "assia"],
        "oracle": "Product_Manager_Chef_de_projet → RACHEDI Assia",
    },
    {
        "id": "Q6",
        "theme": "stack",
        "question": "Quels langages de programmation pour Accolade ?",
        "expect_any": ["java"],
        "expect_all_soft": ["ts", "typescript", "java"],
        "oracle": "Langages=TS, Java",
    },
    {
        "id": "Q7",
        "theme": "rgaa-positif",
        "question": "Quel est le taux RGAA de C2S ?",
        "expect_any": ["81", "0,81", "0.81"],
        "oracle": "RGAA_Taux_de_conformite=0.81",
    },
    {
        "id": "Q8",
        "theme": "techno",
        "question": "C2S est-il en monorepo ?",
        "expect_any": ["oui"],
        "oracle": "Monorepo=true",
    },
    {
        "id": "Q9",
        "theme": "sécurité",
        "question": "MANDOLINE a-t-il la MFA ?",
        "expect_any": ["oui"],
        "oracle": "MFA=Oui",
    },
    {
        "id": "Q10",
        "theme": "sparse",
        "question": "Quel est le taux RGAA de DSN BDD ?",
        "expect_any": [
            "non renseigne",
            "pas renseigne",
            "n'est pas renseigne",
            "non disponible",
            "absent",
        ],
        "expect_product": "DSN BDD",
        "oracle": "DSN BDD · RGAA vide",
    },
    {
        "id": "Q11",
        "theme": "inconnu",
        "question": "Quel hébergeur pour le produit ZXQRTY-INCONNU-42 ?",
        "expect_any": [
            "aucun",
            "ne correspond",
            "introuvable",
            "pas trouve",
            "pas de produit",
            "precisez",
            "verifiez",
            "orthographe",
        ],
        "expect_none": ["cegedim", "ovh"],
        "oracle": "Produit inexistant",
    },
    {
        "id": "Q12",
        "theme": "ambigu",
        "question": "Parle-moi du produit SISE-EAUX",
        "expect_any": [
            "plusieurs",
            "precisez",
            "preciser",
            "candidat",
            "lequel",
            "parmi",
            "correspond",
        ],
        "oracle": "Ambiguïté SISE-EAUX",
    },
]

CASES_COMPLEX: List[Dict[str, Any]] = [
    {
        "id": "C1",
        "theme": "synthèse-stack",
        "question": (
            "Pour Accolade, résume la stack technique : langages, frameworks "
            "front et back, base de données, et système d’authentification."
        ),
        "expect_all": ["java", "react", "spring", "postgresql"],
        "expect_any": ["specifique", "spécifique", "ts", "typescript"],
        "expect_product": "ACCOLADE",
        "oracle": "TS/Java · React · Spring · PostgreSQL · IAM Spécifique",
    },
    {
        "id": "C2",
        "theme": "booléens-multi",
        "question": (
            "Accolade est-il un SI sensible, HDS, SecNumCloud, ou branché ProConnect ? "
            "Réponds clairement pour chaque point."
        ),
        "expect_all": ["non", "sensible", "hds", "proconnect"],
        "expect_product": "ACCOLADE",
        "oracle": "SI_sensible/HDS/Secnumcloud/ProConnect = false",
    },
    {
        "id": "C3",
        "theme": "renovsi",
        "question": (
            "Quelle est la cible RenovSI 2026 et 2027 pour Accolade ? "
            "Y a-t-il un portage DSFR prévu ?"
        ),
        "expect_any": ["atlas", "p3", "p0"],
        "expect_all_soft": ["2026", "2027", "dsfr", "faire"],
        "expect_product": "ACCOLADE",
        "oracle": "2026=P0 Aucun · 2027=P3 ATLAS · Portage_DSFR=À faire",
    },
    {
        "id": "C4",
        "theme": "conformité",
        "question": (
            "Quel est le statut d’homologation de sécurité d’Accolade, "
            "et le taux RGAA s’il existe ?"
        ),
        "expect_any": ["homologation en cours", "en cours"],
        "expect_all_soft": ["non renseigne", "pas renseigne", "n'est pas renseigne", "absent"],
        "expect_product": "ACCOLADE",
        "oracle": "Homologation en cours · RGAA non renseigné",
    },
    {
        "id": "C5",
        "theme": "gouvernance-riche",
        "question": (
            "Pour MANDOLINE : département, direction métier, criticité, "
            "statut actuel, et inscription au PCA."
        ),
        "expect_all": ["gps", "dgcs"],
        "expect_any": ["essentiel", "build", "pca", "non"],
        "expect_product": "MANDOLINE",
        "oracle": "GPS · DGCS · criticité 2 · En build · PCA Non",
    },
    {
        "id": "C6",
        "theme": "sécurité-contraste",
        "question": (
            "AQUA-SISE : est-ce un service critique, HDS, obsolète, "
            "et quel est le taux RGAA approximatif ?"
        ),
        "expect_any": ["critique", "hds", "oui"],
        "expect_all_soft": ["obsolesc", "50", "0,50", "0.50", "51", "0.51", "508"],
        "expect_product": "AQUA-SISE",
        "oracle": "Critique · HDS true · Obsolescence true · RGAA≈0.5082",
    },
    {
        "id": "C7",
        "theme": "comparaison-rgaa",
        "question": (
            "Entre C2S et MANDOLINE, lequel a le meilleur taux RGAA ? "
            "Donne les deux valeurs."
        ),
        "expect_any": ["c2s"],
        "expect_all_soft": ["81", "0.81", "0,81", "mandoline"],
        "expect_products": ["C2S", "MANDOLINE"],
        "oracle": "C2S 0.81 > MANDOLINE 0.0083",
    },
    {
        "id": "C8",
        "theme": "comparaison-hebergement",
        "question": (
            "Compare l’hébergement de Accolade et de LABOé-SI : "
            "qui héberge quoi ?"
        ),
        "expect_all": ["cegedim", "ovh"],
        "expect_products": ["ACCOLADE", "LABOé-SI"],
        "oracle": "Accolade=CEGEDIM · LABOé-SI=OVH",
    },
    {
        "id": "C9",
        "theme": "comparaison-auth",
        "question": (
            "Quelle différence d’authentification (IAM) entre Accolade et C2S ?"
        ),
        "expect_any": ["keycloak"],
        "expect_all_soft": ["specifique", "spécifique", "accolade", "c2s"],
        "expect_products": ["ACCOLADE", "C2S"],
        "oracle": "Accolade=Spécifique · C2S=Keycloak",
    },
    {
        "id": "C10",
        "theme": "cycle-vie",
        "question": (
            "LABOé-SI est-il encore en production selon le statut actuel ? "
            "Qu’en dit le champ obsolescence ?"
        ),
        "expect_any": ["decommission", "décommission", "decomission"],
        "expect_all_soft": ["obsolesc", "non"],
        "expect_product": "LABOé-SI",
        "oracle": "Statut=Décommissionné · Obsolescence=false",
    },
    {
        "id": "C11",
        "theme": "métier-porteur",
        "question": (
            "Qui porte métier Accolade (direction / référent national) "
            "et quel est le secteur fonctionnel ?"
        ),
        "expect_any": ["dgcs"],
        "expect_all_soft": ["cohesion", "cohésion", "inclusion", "sociale"],
        "expect_product": "ACCOLADE",
        "oracle": "DGCS · Cohésion Sociale - Inclusion sociale",
    },
    {
        "id": "C12",
        "theme": "piège-invention",
        "question": (
            "Accolade et C2S : lesquels sont au PCA, et Accolade a-t-il un taux "
            "RGAA de 100 % ?"
        ),
        "expect_any": ["non"],
        "expect_none": ["rgaa de 100", "taux rgaa de 100", "100 % rgaa", "rgaa = 100"],
        "expect_all_soft": ["pca", "renseigne", "accolade", "c2s"],
        "expect_products": ["ACCOLADE", "C2S"],
        "oracle": "PCA Non pour les deux · Accolade RGAA non renseigné (pas 100 %)",
    },
]


CASES_EXPLORE: List[Dict[str, Any]] = [
    {
        "id": "E1",
        "theme": "dict-complet",
        "question": (
            "Quels sont les besoins DICT (disponibilité, intégrité, confidentialité, "
            "traçabilité) d’Accolade ?"
        ),
        "expect_all": ["disponibilite", "integrite", "confidentialite", "tracabilite"],
        "expect_any": ["jour", "imputabilite", "restreintes", "alterations"],
        "expect_product": "ACCOLADE",
        "oracle": "DICT Accolade : Dispo 2 · Intégrité 2 · Conf 2 · Traçab 3",
    },
    {
        "id": "E2",
        "theme": "dat-alias",
        "question": (
            "Pour Accolade, résume les besoins DAT : dis-moi clairement "
            "disponibilité et confidentialité."
        ),
        "expect_any": ["disponibilite", "disponibilité", "jour"],
        "expect_all_soft": ["confidentialite", "confidentialité", "restreintes"],
        "expect_product": "ACCOLADE",
        "oracle": "DAT = DICT · Dispo « un jour » · Conf « restreintes »",
    },
    {
        "id": "E3",
        "theme": "dict-sensible",
        "question": (
            "MANDOLINE : quel niveau de confidentialité DICT, et la traçabilité "
            "est-elle au niveau « opposabilité légale » ?"
        ),
        "expect_any": ["tres sensibles", "très sensibles", "opposabilite", "opposabilité"],
        "expect_product": "MANDOLINE",
        "oracle": "Conf niveau 4 · Traçabilité niveau 4 opposabilité légale",
    },
    {
        "id": "E4",
        "theme": "dict-comparaison",
        "question": (
            "Entre Accolade et C2S, lequel a l’exigence de disponibilité DICT "
            "la plus forte (indisponibilité la moins tolérée) ?"
        ),
        "expect_any": ["c2s", "4h"],
        "expect_products": ["ACCOLADE", "C2S"],
        "oracle": "C2S : 4h tolérable vs Accolade : un jour",
    },
    {
        "id": "E5",
        "theme": "datia-produit",
        "question": (
            "Pour le produit DATIA TBD, quels sont les besoins DICT "
            "disponibilité et traçabilité ?"
        ),
        "expect_any": ["superieure", "supérieure", "jour", "traces", "pas besoin"],
        "expect_product": "DATIA TBD",
        "oracle": "DATIA TBD · Dispo niv.1 · Traçab « Pas besoin de traces »",
    },
    {
        "id": "E6",
        "theme": "datia-tdb",
        "question": (
            "Le produit TDB IA DAT'IA : département SDPC et besoin DICT "
            "de confidentialité ?"
        ),
        "expect_any": ["sdcid", "dia", "sensibles"],
        "expect_product": "TDB IA DAT'IA",
        "oracle": "SDCID/DIA · Conf « informations sensibles »",
    },
    {
        "id": "E7",
        "theme": "rgaa-normalise",
        "question": "Quel est le taux RGAA de C2S ? Réponds en pourcentage.",
        "expect_any": ["81 %", "81%"],
        "expect_product": "C2S",
        "oracle": "Faits normalisés → 81 % (ratio 0.81)",
    },
    {
        "id": "E8",
        "theme": "jdma",
        "question": (
            "Accolade est-il sur Je Donne Mon Avis, et y a-t-il un lien stats JDMA ?"
        ),
        "expect_any": ["oui", "jedonnemonavis", "jdma"],
        "expect_product": "ACCOLADE",
        "oracle": "Je_Donne_Mon_Avis=true · Lien JDMA présent",
    },
    {
        "id": "E9",
        "theme": "volumetrie-prestataire",
        "question": (
            "Pour C2S : volumétrie utilisateurs par an et prestataire de développement ?"
        ),
        "expect_any": ["capgemini"],
        "expect_all_soft": ["10 001", "100 000", "100000", "10 000"],
        "expect_product": "C2S",
        "oracle": "10 001 à 100 000 · Capgemini",
    },
    {
        "id": "E10",
        "theme": "criticite-saisonniere",
        "question": (
            "MANDOLINE a-t-il une criticité saisonnière, et quelle est sa criticité globale ?"
        ),
        "expect_any": ["oui", "essentiel"],
        "expect_product": "MANDOLINE",
        "oracle": "Criticité saisonnière oui · Criticité 2 essentiel",
    },
    {
        "id": "E11",
        "theme": "support-petp",
        "question": (
            "PETP : mode de support utilisateur, et inscription au PCA ?"
        ),
        "expect_any": ["referent", "référent"],
        "expect_all_soft": ["pca", "non"],
        "expect_product": "PETP",
        "oracle": "Support via le référent · PCA Non",
    },
    {
        "id": "E12",
        "theme": "onvs-dict-rgaa",
        "question": (
            "ONVS : besoin DICT de confidentialité, et taux RGAA en pourcentage ?"
        ),
        "expect_any": ["sensibles", "57 %", "57%"],
        "expect_product": "ONVS",
        "oracle": "Conf sensibles · RGAA ≈ 57 %",
    },
]


CASES_AGGREGATE: List[Dict[str, Any]] = [
    {
        "id": "A1",
        "theme": "rgaa-moyenne-parc",
        "question": (
            "Donne moi la moyenne des taux de RGAA renseigné sur l’ensemble du parc"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["48", "%"],
        "expect_all_soft": ["110", "416"],
        "expect_none": [
            "ambigu",
            "plusieurs produits possibles",
            "base de donnees publique",
            "base de données publique",
            "collez",
            "tarif",
        ],
        "oracle": "Agrégat · moyenne ≈ 48,72 % sur 110 / 416 fiches avec taux renseigné",
    },
    {
        "id": "A2",
        "theme": "rgaa-moyenne-reformulation",
        "question": (
            "Quelle est la moyenne du taux de conformité RGAA pour tous les produits "
            "qui l’ont renseigné ?"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["48", "%"],
        "expect_none": ["ambigu", "plusieurs produits possibles"],
        "oracle": "Même agrégat rgaa_mean · ~48,72 %",
    },
    {
        "id": "A3",
        "theme": "count-produits",
        "question": "Combien de produits y a-t-il dans Le PARC ?",
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["416"],
        "expect_none": ["ambigu"],
        "oracle": "416 fiches Produits_DNUM",
    },
    {
        "id": "A4",
        "theme": "rgaa-count",
        "question": "Combien de produits ont un taux RGAA renseigné ?",
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["110"],
        "expect_all_soft": ["416", "%"],
        "expect_none": ["ambigu", "plusieurs produits possibles"],
        "oracle": "110 / 416 (~26 %)",
    },
    {
        "id": "A5",
        "theme": "jdma-count",
        "question": (
            "Sur l’ensemble du parc, combien de produits sont sur Je Donne Mon Avis ?"
        ),
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["20"],
        "expect_none": ["ambigu"],
        "oracle": "20 produits JDMA = oui",
    },
    {
        "id": "A6",
        "theme": "hds-count",
        "question": "Combien de produits sont HDS sur le parc ?",
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["5"],
        "expect_none": ["ambigu"],
        "oracle": "5 produits HDS = oui",
    },
    {
        "id": "A7",
        "theme": "pca-count",
        "question": "Combien de produits sont inscrits au PCA dans Le PARC ?",
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["59"],
        "expect_none": ["ambigu"],
        "oracle": "59 inscriptions PCA « oui »",
    },
    {
        "id": "A8",
        "theme": "non-agregat-produit",
        "question": "Quel est le taux RGAA de C2S ? Réponds en pourcentage.",
        "expect_facts_tool": "parc_produit",
        "expect_product": "C2S",
        "expect_any": ["81 %", "81%"],
        "expect_none": ["moyenne", "416"],
        "oracle": "Fiche C2S · 81 % — ne doit PAS basculer en agrégat",
    },
    {
        "id": "A9",
        "theme": "jdma-liste",
        "question": 'liste moi les produits qui ont "Je Donne Mon Avis"',
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["20", "accolade", "mandoline"],
        "expect_all_soft": ["1j1s", "egapro"],
        "expect_none": [
            "ambigu",
            "plusieurs produits possibles",
            "une seule fiche",
            "filtre sur le champ",
        ],
        "oracle": "Liste des 20 produits JDMA=oui (pas une fiche isolée « LISTE »)",
    },
    {
        "id": "A10",
        "theme": "hds-liste",
        "question": "Quels sont les produits avec un environnement HDS ?",
        "expect_facts_tool": "parc_agregat",
        "expect_any": ["5", "hds"],
        "expect_none": [
            "not_found",
            "aucun produit visible",
            "ambigu",
            "orthographe",
        ],
        "oracle": "Liste des 5 produits HDS=oui",
    },
]


def cases_for_suite(suite: str) -> List[Dict[str, Any]]:
    s = (suite or "complex").strip().lower()
    if s == "basic":
        return list(CASES_BASIC)
    if s == "complex":
        return list(CASES_COMPLEX)
    if s in ("explore", "dict", "dat"):
        return list(CASES_EXPLORE)
    if s in ("aggregate", "agregat", "agg"):
        return list(CASES_AGGREGATE)
    if s in ("role-cdp", "cdp", "chef-projet"):
        return list(CASES_ROLE_CDP)
    if s in ("role-manager", "manager", "responsable"):
        return list(CASES_ROLE_MANAGER)
    if s in ("role-direction", "direction", "dir"):
        return list(CASES_ROLE_DIRECTION)
    if s in ("roles", "role"):
        return (
            list(CASES_ROLE_CDP)
            + list(CASES_ROLE_MANAGER)
            + list(CASES_ROLE_DIRECTION)
        )
    if s == "all":
        return (
            list(CASES_BASIC)
            + list(CASES_COMPLEX)
            + list(CASES_EXPLORE)
            + list(CASES_AGGREGATE)
            + list(CASES_ROLE_CDP)
            + list(CASES_ROLE_MANAGER)
            + list(CASES_ROLE_DIRECTION)
        )
    return list(CASES_COMPLEX)
