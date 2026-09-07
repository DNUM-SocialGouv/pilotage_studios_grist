import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  enfantLibelleSansMaster,
  groupSuiviByMissionHierarchy,
  SANS_MISSION_GROUP_KEY,
  SANS_PRESTATION_GROUP_KEY,
} from "./groupSuiviByMissionEnfant.ts";

const enfants: MissionEnfant[] = [
  { id: 10, Mission: 100, Intervenant: 1, Libelle: "Alice — Design" },
  { id: 11, Mission: 100, Intervenant: 2, Libelle: "Bob — RU" },
  { id: 20, Mission: 200, Intervenant: 1, Libelle: "Product manager VAO" },
];

const masters = new Map<number, Mission>([
  [100, { id: 100, Nom_de_la_mission: "Lot VAO" }],
  [200, { id: 200, Nom_de_la_mission: "Réalisation du produit VAO" }],
]);

describe("enfantLibelleSansMaster", () => {
  it("retire le préfixe master du Libelle", () => {
    const e: MissionEnfant = {
      id: 1,
      Mission: 100,
      Libelle: "Lot VAO — Alice — Design",
    };
    assert.equal(enfantLibelleSansMaster(e, "Lot VAO"), "Alice — Design");
  });

  it("conserve le Libelle s’il ne contient pas le master", () => {
    const e: MissionEnfant = {
      id: 1,
      Mission: 100,
      Libelle: "Alice — Design",
    };
    assert.equal(enfantLibelleSansMaster(e, "Lot VAO"), "Alice — Design");
  });
});

describe("groupSuiviByMissionHierarchy", () => {
  it("regroupe plusieurs prestations sous une même mission master", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 2, Calcul_TTC: 200 },
      { id: 2, Mission_enfant: 10, Nb_jours: 1, Calcul_TTC: 100 },
      { id: 3, Mission_enfant: 11, Nb_jours: 3, Calcul_TTC: 300 },
    ];
    const groups = groupSuiviByMissionHierarchy(rows, enfants, {
      masterById: masters,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.key, 100);
    assert.equal(groups[0]!.libelle, "Lot VAO");
    assert.equal(groups[0]!.enfants.length, 2);
    assert.deepEqual(groups[0]!.totaux, { jours: 6, ttc: 600, count: 3 });
    assert.equal(groups[0]!.enfants[0]!.libelle, "Alice — Design");
    assert.equal(groups[0]!.enfants[1]!.libelle, "Bob — RU");
  });

  it("ne concatène pas master + enfant dans le libellé prestation", () => {
    const enfantsDup: MissionEnfant[] = [
      {
        id: 20,
        Mission: 200,
        Intervenant: 1,
        Libelle: "Réalisation du produit VAO — Product manager VAO",
      },
    ];
    const rows: SuiviMensuel[] = [{ id: 1, Mission_enfant: 20, Nb_jours: 1, Calcul_TTC: 10 }];
    const groups = groupSuiviByMissionHierarchy(rows, enfantsDup, {
      masterById: masters,
    });
    assert.equal(groups[0]!.libelle, "Réalisation du produit VAO");
    assert.equal(groups[0]!.enfants[0]!.libelle, "Product manager VAO");
  });

  it("place le legacy sans Mission_enfant sous le master Missions", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Missions: 100, Nb_jours: 1, Calcul_TTC: 50 },
      { id: 2, Mission_enfant: 10, Nb_jours: 2, Calcul_TTC: 200 },
    ];
    const groups = groupSuiviByMissionHierarchy(rows, enfants, {
      masterById: masters,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.key, 100);
    assert.equal(groups[0]!.enfants.length, 2);
    const legacy = groups[0]!.enfants.find((e) => e.libelle === "Sans prestation (legacy)");
    assert.ok(legacy);
    assert.deepEqual(legacy!.totaux, { jours: 1, ttc: 50, count: 1 });
  });

  it("bucket racine Sans mission si aucun master", () => {
    const rows: SuiviMensuel[] = [{ id: 1, Nb_jours: 1, Calcul_TTC: 10 }];
    const groups = groupSuiviByMissionHierarchy(rows, [], {});
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.key, SANS_MISSION_GROUP_KEY);
    assert.equal(groups[0]!.enfants[0]!.key, SANS_PRESTATION_GROUP_KEY);
  });

  it("retourne [] si aucune ligne", () => {
    assert.deepEqual(groupSuiviByMissionHierarchy([], enfants), []);
  });

  it("Mission_enfant inconnu : libellé Prestation #id sous master Missions si présent", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 999, Missions: 100, Nb_jours: 1, Calcul_TTC: 40 },
    ];
    const groups = groupSuiviByMissionHierarchy(rows, enfants, {
      masterById: masters,
    });
    assert.equal(groups.length, 1);
    assert.equal(groups[0]!.key, 100);
    assert.equal(groups[0]!.enfants.length, 1);
    assert.equal(groups[0]!.enfants[0]!.key, 999);
    assert.equal(groups[0]!.enfants[0]!.libelle, "Prestation #999");
    assert.equal(groups[0]!.enfants[0]!.enfant, null);
  });

  it("plusieurs masters distincts restent séparés", () => {
    const rows: SuiviMensuel[] = [
      { id: 1, Mission_enfant: 10, Nb_jours: 1, Calcul_TTC: 10 },
      { id: 2, Mission_enfant: 20, Nb_jours: 2, Calcul_TTC: 20 },
    ];
    const groups = groupSuiviByMissionHierarchy(rows, enfants, {
      masterById: masters,
    });
    assert.equal(groups.length, 2);
    assert.equal(groups[0]!.key, 100);
    assert.equal(groups[1]!.key, 200);
  });
});
