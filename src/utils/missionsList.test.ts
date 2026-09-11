import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  aggregateCraByEnfantId,
  aggregateCraByMissionId,
  groupSuiviRowsByEnfantId,
  sumSuiviTtcHorsPrestationForMission,
  totauxCraForEnfant,
} from "./craByMission.ts";
import { missionEnfantFromGrist } from "./missionEnfants.ts";
import {
  enfantsByMasterId,
  missionDepartementOptions,
  missionIntervenantOptions,
  missionLibelle,
  missionMatchesFilters,
  missionProduitOptions,
  missionStatutOptions,
  type MissionsListFilters,
} from "./missionsList.ts";

const missions: Mission[] = [
  {
    id: 1,
    Nom_de_la_mission: "Lot VAO",
    Statut: "En cours",
    Equipe2: ["L", "Design"],
    Produit_SDPC: 10,
    Departement: ["L", "DNUM"],
    Intervenants: 101,
  },
  {
    id: 2,
    Nom_de_la_mission: "Investigation Score",
    Statut: "A instruire",
    Equipe2: "RU",
    Departement: "DSS",
    Produit_SDPC: 20,
  },
];

const enfants: MissionEnfant[] = [
  { id: 10, Mission: 1, Intervenant: 201 },
  { id: 11, Mission: 2, Intervenant: 202 },
];

function filters(partial: Partial<MissionsListFilters> = {}): MissionsListFilters {
  return {
    search: "",
    equipe: "",
    statut: [],
    departement: "",
    produitIds: [],
    intervenantIds: [],
    ...partial,
  };
}

describe("missionMatchesFilters", () => {
  const produitsById = new Map([
    [10, "VAO"],
    [20, "Score"],
  ]);
  const matches = (m: Mission, partial: Partial<MissionsListFilters>): boolean =>
    missionMatchesFilters(m, filters(partial), produitsById, enfants);

  it("filtre par statut et équipe", () => {
    assert.equal(matches(missions[0]!, { equipe: "Design", statut: ["En cours"] }), true);
    assert.equal(matches(missions[0]!, { equipe: "RU" }), false);
  });

  it("recherche sur nom et produit", () => {
    assert.equal(matches(missions[0]!, { search: "vao" }), true);
    assert.equal(matches(missions[1]!, { search: "vao" }), false);
  });

  it("filtre par département", () => {
    assert.equal(matches(missions[0]!, { departement: "DNUM" }), true);
    assert.equal(matches(missions[0]!, { departement: "DSS" }), false);
  });

  it("filtre par produit", () => {
    assert.equal(matches(missions[0]!, { produitIds: ["10"] }), true);
    assert.equal(matches(missions[1]!, { produitIds: ["10"] }), false);
  });

  it("filtre par intervenant (enfants + legacy)", () => {
    assert.equal(matches(missions[0]!, { intervenantIds: ["201"] }), true);
    assert.equal(matches(missions[0]!, { intervenantIds: ["101"] }), true);
    assert.equal(matches(missions[0]!, { intervenantIds: ["202"] }), false);
  });

  it("combine département et produit (AND)", () => {
    assert.equal(matches(missions[0]!, { departement: "DNUM", produitIds: ["10"] }), true);
    assert.equal(matches(missions[0]!, { departement: "DSS", produitIds: ["10"] }), false);
    assert.equal(matches(missions[1]!, { departement: "DSS", produitIds: ["10"] }), false);
  });

  it("filtre statut et produit en OR (plusieurs valeurs)", () => {
    assert.equal(matches(missions[0]!, { statut: ["En cours", "A instruire"] }), true);
    assert.equal(matches(missions[1]!, { statut: ["En cours", "A instruire"] }), true);
    assert.equal(matches(missions[0]!, { produitIds: ["10", "20"] }), true);
    assert.equal(matches(missions[1]!, { produitIds: ["10", "20"] }), true);
    assert.equal(matches(missions[0]!, { statut: ["A instruire"] }), false);
  });

  it("filtre intervenant en OR (intersection avec enfants / legacy)", () => {
    assert.equal(matches(missions[0]!, { intervenantIds: ["201", "202"] }), true);
    assert.equal(matches(missions[1]!, { intervenantIds: ["201", "202"] }), true);
    assert.equal(matches(missions[0]!, { intervenantIds: ["202"] }), false);
  });

  it("filtre par intervenant sur enfants mappés depuis Mission_parent", () => {
    const mapped = missionEnfantFromGrist({
      Mission_parent: 1,
      Mission_enfant: "Coaching",
    });
    const liveEnfants: MissionEnfant[] = [{ id: 30, ...mapped, Intervenant: 301 }];
    const liveMission: Mission = { id: 1, Nom_de_la_mission: "Lot VAO" };
    assert.equal(
      missionMatchesFilters(
        liveMission,
        filters({ intervenantIds: ["301"] }),
        produitsById,
        liveEnfants,
      ),
      true,
    );
    assert.equal(
      missionMatchesFilters(
        liveMission,
        filters({ intervenantIds: ["201"] }),
        produitsById,
        liveEnfants,
      ),
      false,
    );
  });

  it("filtre staffing avec / sans prestation", () => {
    const byMaster = enfantsByMasterId(enfants);
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ staffing: "avec-prestation" }), produitsById, enfants, {
        enfantsByMaster: byMaster,
      }),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ staffing: "sans-prestation" }), produitsById, enfants, {
        enfantsByMaster: byMaster,
      }),
      false,
    );
    const lonely: Mission = { id: 99, Nom_de_la_mission: "Sans staff" };
    assert.equal(
      missionMatchesFilters(lonely, filters({ staffing: "sans-prestation" }), produitsById, enfants, {
        enfantsByMaster: byMaster,
      }),
      true,
    );
  });
});

describe("missionLibelle / options", () => {
  it("fallback id si nom vide", () => {
    assert.equal(missionLibelle({ id: 9 }), "Mission #9");
  });

  it("liste les statuts distincts triés", () => {
    assert.deepEqual(missionStatutOptions(missions), ["A instruire", "En cours"]);
  });

  it("liste les départements distincts triés", () => {
    assert.deepEqual(missionDepartementOptions(missions), ["DNUM", "DSS"]);
  });

  it("liste les produits présents sur les missions", () => {
    const produitsById = new Map([
      [10, "VAO"],
      [20, "Score"],
    ]);
    assert.deepEqual(missionProduitOptions(missions, produitsById), [
      { id: 20, label: "Score" },
      { id: 10, label: "VAO" },
    ]);
  });

  it("liste les intervenants staffés", () => {
    const intervenantsById = new Map([
      [101, "Alice"],
      [201, "Bob"],
      [202, "Chloé"],
    ]);
    assert.deepEqual(missionIntervenantOptions(missions, enfants, intervenantsById), [
      { id: 101, label: "Alice" },
      { id: 201, label: "Bob" },
      { id: 202, label: "Chloé" },
    ]);
  });

  it("groupe les enfants via Mission déjà mappé (ingest Mission_parent)", () => {
    const mapped = missionEnfantFromGrist({
      Mission_parent: 1,
      Mission_enfant: "Coaching",
    });
    const liveEnfants: MissionEnfant[] = [
      { id: 30, ...mapped, Intervenant: 301 },
      { id: 31, Mission: 2, Intervenant: 202 },
    ];
    const byMaster = enfantsByMasterId(liveEnfants);
    assert.equal(byMaster.get(1)?.length, 1);
    assert.equal(byMaster.get(1)?.[0]?.id, 30);
    assert.equal(byMaster.get(2)?.[0]?.id, 31);
  });
});

describe("aggregateCraByMissionId", () => {
  const enfants: MissionEnfant[] = [{ id: 10, Mission: 1 }];

  it("somme les CRA via enfant puis fallback master", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 2, Calcul_TTC: 200 },
      { id: 2, Missions: 1, Nb_jours: 1, Calcul_TTC: 50 },
      { id: 3, Missions: 2, Nb_jours: 4, Calcul_TTC: 400 },
    ];
    const map = aggregateCraByMissionId(rows, enfants);
    assert.deepEqual(map.get(1), { jours: 3, ttc: 250, count: 2 });
    assert.deepEqual(map.get(2), { jours: 4, ttc: 400, count: 1 });
  });
});

describe("totauxCraForEnfant", () => {
  it("ignore les lignes d’un autre enfant", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 2, Calcul_TTC: 20 },
      { id: 2, Mission_enfant: 11, Nb_jours: 9, Calcul_TTC: 90 },
    ];
    assert.deepEqual(totauxCraForEnfant(rows, 10), { jours: 2, ttc: 20, count: 1 });
  });
});

describe("aggregateCraByEnfantId", () => {
  it("agrège par ref Realise.Mission_enfant et ignore un autre enfant", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 2, Calcul_TTC: 20 },
      { id: 2, Mission_enfant: 10, Nb_jours: 1, Calcul_TTC: 10 },
      { id: 3, Mission_enfant: 11, Nb_jours: 9, Calcul_TTC: 90 },
      { id: 4, Missions: 1, Nb_jours: 4, Calcul_TTC: 40 },
    ];
    const map = aggregateCraByEnfantId(rows);
    assert.deepEqual(map.get(10), { jours: 3, ttc: 30, count: 2 });
    assert.deepEqual(map.get(11), { jours: 9, ttc: 90, count: 1 });
    assert.equal(map.has(1), false);
  });

  it("n’utilise pas un id texte comme rattachement (homonyme libellé)", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: "Coaching Produit", Nb_jours: 2, Calcul_TTC: 20 },
    ];
    const map = aggregateCraByEnfantId(rows);
    assert.equal(map.size, 0);
  });
});

describe("groupSuiviRowsByEnfantId", () => {
  it("groupe les lignes CRA par prestation", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 1 },
      { id: 2, Mission_enfant: 10, Nb_jours: 2 },
      { id: 3, Mission_enfant: 11, Nb_jours: 3 },
      { id: 4, Missions: 1, Nb_jours: 4 },
    ];
    const map = groupSuiviRowsByEnfantId(rows);
    assert.equal(map.get(10)?.length, 2);
    assert.equal(map.get(11)?.length, 1);
    assert.equal(map.has(1), false);
  });
});

describe("sumSuiviTtcHorsPrestationForMission", () => {
  it("somme le TTC legacy hors enfants connus", () => {
    const enfants: MissionEnfant[] = [{ id: 10, Mission: 100 }];
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Missions: 100, Calcul_TTC: 50 },
      { id: 2, Missions: 100, Calcul_TTC: 75 },
      { id: 3, Missions: 200, Calcul_TTC: 10 },
    ];
    assert.equal(sumSuiviTtcHorsPrestationForMission(rows, 100, enfants), 75);
  });
});
