import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  buildMissionAssistantFacts,
  extractMissionIdFromQuestion,
  missionIdFromPath,
  pluralFoldVariants,
  questionAllowsPathMissionFallback,
  questionLooksLikeCraPrestationRule,
  questionLooksLikeMissionCra,
  questionLooksLikeOtherDomain,
  resolveMissionAssistantFacts,
  resolveMissionFromQuestion,
  topMissionMatches,
} from "./assistantMissionFacts.ts";

const missionVao: Mission = {
  id: 469,
  Nom_de_la_mission: "Réalisation du produit VAO",
};

const missionJpme: Mission = {
  id: 512,
  Nom_de_la_mission: "Accompagnement JPME",
};

function fixtureQ1Q2(): {
  missions: Mission[];
  enfants: MissionEnfant[];
  suivi: SuiviMensuel[];
} {
  const enfants: MissionEnfant[] = [
    { id: 1001, Mission: 469, Jours_envisages: 100 },
    { id: 1002, Mission: 469, Jours_envisages: 50 },
    { id: 2000, Mission: 999, Jours_envisages: 10 },
  ];
  const suivi: SuiviMensuel[] = [
    { id: 1, Mission_enfant: 1001, Nb_jours: 200, Calcul_TTC: 190_000 },
    { id: 2, Mission_enfant: 1002, Nb_jours: 123.55, Calcul_TTC: 118_060.85 },
    { id: 3, Missions: 469, Nb_jours: 14, Calcul_TTC: 0 },
    { id: 4, Mission_enfant: 2000, Nb_jours: 5, Calcul_TTC: 500 },
  ];
  return {
    missions: [missionVao, missionJpme, { id: 999, Nom_de_la_mission: "Autre" }],
    enfants,
    suivi,
  };
}

describe("extractMissionIdFromQuestion", () => {
  it("lit un id seulement dans un contexte mission (secours)", () => {
    assert.equal(
      extractMissionIdFromQuestion(
        "Combien de jours CRA sur la mission Réalisation du produit VAO (id 469) ?",
      ),
      469,
    );
    assert.equal(extractMissionIdFromQuestion("mission id 469"), 469);
  });

  it("D1 : ne prend pas l’id d’un BDC", () => {
    assert.equal(
      extractMissionIdFromQuestion(
        "Sur le BDC 2025-2910D47 - Audit design VigieRH (id 1) : budget, consommé, solde ?",
      ),
      null,
    );
  });
});

describe("resolveMissionFromQuestion — noms / acronymes", () => {
  it("résout VAO et JPME par jeton, sans id", () => {
    const { missions } = fixtureQ1Q2();
    assert.equal(
      resolveMissionFromQuestion("Quel TTC CRA sur la mission VAO ?", missions)?.id,
      469,
    );
    assert.equal(
      resolveMissionFromQuestion("Combien de jours CRA sur JPME ?", missions)?.id,
      512,
    );
  });

  it("ne laisse pas « pour » / « mission » / « quel » égaliser d’autres libellés avec JPME", () => {
    const missions: Mission[] = [
      { id: 370, Nom_de_la_mission: "Investigation sur JPME" },
      { id: 99, Nom_de_la_mission: "Accompagnement pour animer des ateliers RETEX" },
      { id: 3, Nom_de_la_mission: "Mission spéciale" },
      { id: 491, Nom_de_la_mission: "Accompagnement pour le produit AgreSanté" },
      {
        id: 145,
        Nom_de_la_mission:
          'PHAREL - Quel effort pour réveiller la partie "forkée" de DS (dév, hébergement, etc.) ?',
      },
    ];
    const q = "Quel est le consommé pour la mission JPME ?";
    assert.equal(resolveMissionFromQuestion(q, missions)?.id, 370);
    const result = resolveMissionAssistantFacts(q, missions, [], [], "/");
    assert.ok(result && result.tool === "mission_cra" && !("unresolved" in result));
    if (result && result.tool === "mission_cra") {
      assert.equal(result.missionId, 370);
      assert.match(result.missionLabel, /JPME/i);
    }
  });

  it("préfère le libellé complet s’il est dans la question", () => {
    const { missions } = fixtureQ1Q2();
    assert.equal(
      resolveMissionFromQuestion(
        "Combien de jours CRA sur la mission Réalisation du produit VAO ?",
        missions,
      )?.id,
      469,
    );
  });

  it("Site Eaux / Sites Eaux → Refonte sites eaux (pluriel + multi-mots)", () => {
    const missions: Mission[] = [
      { id: 10, Nom_de_la_mission: "[AC] HCE Audit initial du site web" },
      { id: 11, Nom_de_la_mission: "[AC] Site ARS HDF Conseil en stratégie d'accessibilité" },
      { id: 12, Nom_de_la_mission: "[AC] EFH Audit initial site web" },
      { id: 13, Nom_de_la_mission: "[AC] Handicap - Audit du site et suivi mise en accessibilité à 100%" },
      { id: 14, Nom_de_la_mission: "[AC] IGAS Audits du site institutionnel" },
      { id: 420, Nom_de_la_mission: "Refonte sites eaux" },
    ];
    assert.equal(
      resolveMissionFromQuestion("Quel TTC sur Site Eaux", missions)?.id,
      420,
    );
    assert.equal(
      resolveMissionFromQuestion("Quel TTC sur Sites Eaux", missions)?.id,
      420,
    );
  });

  it("un seul jeton « site » ne désigne pas Refonte sites eaux", () => {
    const missions: Mission[] = [
      { id: 10, Nom_de_la_mission: "[AC] HCE Audit initial du site web" },
      { id: 11, Nom_de_la_mission: "[AC] Site ARS HDF Conseil" },
      { id: 420, Nom_de_la_mission: "Refonte sites eaux" },
    ];
    assert.equal(resolveMissionFromQuestion("Quel TTC sur le site ?", missions), null);
    const top = topMissionMatches("Quel TTC sur le site ?", missions, 5);
    assert.ok(top.length >= 2);
  });
});

describe("pluralFoldVariants", () => {
  it("plie site↔sites et eau↔eaux", () => {
    assert.deepEqual(new Set(pluralFoldVariants("site")), new Set(["site", "sites"]));
    assert.deepEqual(new Set(pluralFoldVariants("sites")), new Set(["sites", "site"]));
    assert.deepEqual(new Set(pluralFoldVariants("eaux")), new Set(["eau", "eaux"]));
    assert.deepEqual(pluralFoldVariants("vao"), ["vao"]);
  });
});

describe("questionLooksLikeCraPrestationRule", () => {
  it("détecte Q5", () => {
    assert.equal(
      questionLooksLikeCraPrestationRule(
        "Les CRA sans prestation comptent-ils dans les totaux mission ?",
      ),
      true,
    );
    assert.equal(questionLooksLikeCraPrestationRule("Combien de jours sur VAO ?"), false);
  });
});

describe("questionLooksLikeOtherDomain", () => {
  it("détecte BDC / produit catalogue sans casser le nom VAO", () => {
    assert.equal(
      questionLooksLikeOtherDomain("Sur le BDC 2025-2910D47 (id 1) : budget ?"),
      true,
    );
    assert.equal(
      questionLooksLikeOtherDomain(
        "Combien de jours CRA sur la mission Réalisation du produit VAO ?",
      ),
      false,
    );
  });
});

describe("missionIdFromPath", () => {
  it("extrait l’id depuis /missions/:id", () => {
    assert.equal(missionIdFromPath("/missions/469"), 469);
    assert.equal(missionIdFromPath("/bdc/1"), null);
  });
});

describe("questionLooksLikeMissionCra", () => {
  it("détecte conso / CRA sans faux positifs", () => {
    assert.equal(questionLooksLikeMissionCra("Quel reste sur le BDC ?"), false);
    assert.equal(questionLooksLikeMissionCra("Bonjour"), false);
    assert.equal(
      questionLooksLikeMissionCra("Combien de jours CRA sur la mission VAO ?"),
      true,
    );
  });
});

describe("questionAllowsPathMissionFallback", () => {
  it("autorise CRA/jours mais refuse BDC", () => {
    assert.equal(questionAllowsPathMissionFallback("Combien de jours CRA consommés ?"), true);
    assert.equal(questionAllowsPathMissionFallback("Quel budget du BDC ?"), false);
  });
});

describe("buildMissionAssistantFacts — contrat Q1/Q2", () => {
  it("Q1 / Q2 / Q5 agrégat", () => {
    const { enfants, suivi } = fixtureQ1Q2();
    const facts = buildMissionAssistantFacts(missionVao, suivi, enfants);
    assert.equal(facts.joursCra, 323.55);
    assert.ok(Math.abs(facts.ttcCra - 308_060.85) < 0.01);
    assert.equal(facts.lignesCra, 2);
  });
});

describe("resolveMissionAssistantFacts", () => {
  it("Q5 règle sans mission", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    const result = resolveMissionAssistantFacts(
      "Les CRA sans prestation comptent-ils dans les totaux mission ?",
      missions,
      suivi,
      enfants,
    );
    assert.ok(result && result.tool === "mission_cra_rule");
    if (result && result.tool === "mission_cra_rule") {
      assert.equal(result.answer, false);
    }
  });

  it("résout par nom VAO", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    const result = resolveMissionAssistantFacts(
      "Combien de jours CRA sur la mission VAO ?",
      missions,
      suivi,
      enfants,
    );
    assert.ok(result && !("unresolved" in result) && result.tool === "mission_cra");
    if (result && result.tool === "mission_cra") {
      assert.equal(result.joursCra, 323.55);
    }
  });

  it("D2 : BDC sur fiche mission → wrong_domain", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    const result = resolveMissionAssistantFacts(
      "Quel budget du BDC ?",
      missions,
      suivi,
      enfants,
      "/missions/469",
    );
    assert.ok(result && "unresolved" in result);
    if (result && "unresolved" in result) {
      assert.equal(result.reason, "wrong_domain");
    }
  });

  it("repli page pour CRA sans nom", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    const result = resolveMissionAssistantFacts(
      "Combien de jours CRA consommés ?",
      missions,
      suivi,
      enfants,
      "/missions/469",
    );
    assert.ok(result && result.tool === "mission_cra" && !("unresolved" in result));
  });

  it("need_mission sans pousser un id dans le hint", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    const result = resolveMissionAssistantFacts(
      "Combien de jours CRA consommés ?",
      missions,
      suivi,
      enfants,
      "/",
    );
    assert.ok(result && "unresolved" in result);
    if (result && "unresolved" in result) {
      assert.equal(result.reason, "need_mission");
      assert.doesNotMatch(result.hint, /\bid\b/i);
      assert.match(result.hint, /nom/i);
    }
  });

  it("ignore Bonjour", () => {
    const { missions, enfants, suivi } = fixtureQ1Q2();
    assert.equal(resolveMissionAssistantFacts("Bonjour", missions, suivi, enfants), null);
  });
});
