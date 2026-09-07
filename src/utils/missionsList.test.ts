import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import { aggregateCraByMissionId, totauxCraForEnfant } from "./craByMission.ts";
import {
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
    statut: "",
    departement: "",
    produitId: "",
    intervenantId: "",
    ...partial,
  };
}

describe("missionMatchesFilters", () => {
  const produitsById = new Map([[10, "VAO"]]);

  it("filtre par statut et équipe", () => {
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ equipe: "Design", statut: "En cours" }), produitsById),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ equipe: "RU" }), produitsById),
      false,
    );
  });

  it("recherche sur nom et produit", () => {
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ search: "vao" }), produitsById),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[1]!, filters({ search: "vao" }), produitsById),
      false,
    );
  });

  it("filtre par département", () => {
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ departement: "DNUM" }), produitsById),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ departement: "DSS" }), produitsById),
      false,
    );
  });

  it("filtre par produit", () => {
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ produitId: "10" }), produitsById),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[1]!, filters({ produitId: "10" }), produitsById),
      false,
    );
  });

  it("filtre par intervenant (enfants + legacy)", () => {
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ intervenantId: "201" }), produitsById, enfants),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ intervenantId: "101" }), produitsById, enfants),
      true,
    );
    assert.equal(
      missionMatchesFilters(missions[0]!, filters({ intervenantId: "202" }), produitsById, enfants),
      false,
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
    const produitsById = new Map([[10, "VAO"]]);
    assert.deepEqual(missionProduitOptions(missions, produitsById), [{ id: 10, label: "VAO" }]);
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
