import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMissionCreateFields,
  buildMissionPatch,
  emptyMissionCreateForm,
  missionToFormValues,
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
  });
});
