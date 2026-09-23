import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMissionCreateFields,
  buildMissionPatch,
  emptyMissionCreateForm,
  missionToFormValues,
  parseOptionalPositiveId,
  resolveReassignPrestationId,
  wantsCreatePrestation,
  wantsReassignPrestation,
} from "./missionFormFields.ts";
import type { Mission } from "../types.ts";

describe("missionFormFields", () => {
  it("buildMissionCreateFields exige un nom trimé et statut par défaut", () => {
    const fields = buildMissionCreateFields({
      ...emptyMissionCreateForm(),
      Nom_de_la_mission: "  Rivage  ",
      Produit_SDPC: "42",
    });
    assert.equal(fields.Nom_de_la_mission, "Rivage");
    assert.equal(fields.Statut, "A instruire");
    assert.equal(fields.Produit_SDPC, 42);
  });

  it("emptyMissionCreateForm inclut les champs réaffectation vides", () => {
    const empty = emptyMissionCreateForm();
    assert.equal(empty.missionSource, "");
    assert.equal(empty.prestationExistante, "");
  });

  it("parseOptionalPositiveId et parcours create / réaffecter", () => {
    assert.equal(parseOptionalPositiveId(""), null);
    assert.equal(parseOptionalPositiveId("0"), null);
    assert.equal(parseOptionalPositiveId("12"), 12);
    const reassign = {
      ...emptyMissionCreateForm(),
      prestationExistante: "9",
      prestationIntervenant: "3",
    };
    assert.equal(wantsReassignPrestation(reassign), true);
    assert.equal(wantsCreatePrestation(reassign), false);
    const createOnly = {
      ...emptyMissionCreateForm(),
      prestationIntervenant: "3",
    };
    assert.equal(wantsReassignPrestation(createOnly), false);
    assert.equal(wantsCreatePrestation(createOnly), true);
  });

  it("resolveReassignPrestationId exige parent = mission source", () => {
    const values = {
      ...emptyMissionCreateForm(),
      missionSource: "10",
      prestationExistante: "5",
    };
    assert.equal(
      resolveReassignPrestationId(values, [{ id: 5, Mission: 10 }]),
      5,
    );
    assert.equal(
      resolveReassignPrestationId(values, [{ id: 5, Mission: 99 }]),
      null,
    );
    assert.equal(resolveReassignPrestationId(values, []), null);
  });

  it("buildMissionPatch ne retourne que les champs modifiés", () => {
    const init = emptyMissionCreateForm();
    init.Nom_de_la_mission = "A";
    init.Statut = "En cours";
    init.Produit_SDPC = "1";
    const values = { ...init, Nom_de_la_mission: "B", Statut: "En cours" };
    const patch = buildMissionPatch(values, init);
    assert.deepEqual(patch, { Nom_de_la_mission: "B" });
  });

  it("buildMissionPatch peut vider le produit", () => {
    const init = emptyMissionCreateForm();
    init.Produit_SDPC = "5";
    const values = { ...init, Produit_SDPC: "" };
    const patch = buildMissionPatch(values, init);
    assert.deepEqual(patch, { Produit_SDPC: null });
  });

  it("missionToFormValues lit Produit_SDPC numérique", () => {
    const m: Mission = {
      id: 1,
      Nom_de_la_mission: "Test",
      Statut: "En pause",
      Produit_SDPC: 7,
    };
    const v = missionToFormValues(m);
    assert.equal(v.Produit_SDPC, "7");
    assert.equal(v.Statut, "En pause");
    assert.equal(v.missionSource, "");
    assert.equal(v.prestationExistante, "");
  });
});
