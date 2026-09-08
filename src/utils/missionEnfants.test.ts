import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { missionEnfantFromGrist } from "./missionEnfants.ts";

describe("missionEnfantFromGrist", () => {
  it("mappe Mission_parent et Mission_enfant (texte Grist actuel)", () => {
    const mapped = missionEnfantFromGrist({
      Mission_parent: 51,
      Mission_enfant: "Coaching Produit — David Koss",
    });
    assert.equal(mapped.Mission, 51);
    assert.equal(mapped.Libelle, "Coaching Produit — David Koss");
  });

  it("accepte le schéma legacy Mission / Libelle", () => {
    const mapped = missionEnfantFromGrist({
      Mission: 100,
      Libelle: "Alice — Design",
    });
    assert.equal(mapped.Mission, 100);
    assert.equal(mapped.Libelle, "Alice — Design");
  });

  it("préfère les colonnes actuelles si les deux schémas sont présents", () => {
    const mapped = missionEnfantFromGrist({
      Mission_parent: 51,
      Mission: 99,
      Mission_enfant: "Libellé actuel",
      Libelle: "Libellé legacy",
    });
    assert.equal(mapped.Mission, 51);
    assert.equal(mapped.Libelle, "Libellé actuel");
  });

  it("conserve un Mission_parent encodé en tuple Grist", () => {
    const ref = ["L", 51];
    const mapped = missionEnfantFromGrist({
      Mission_parent: ref,
      Mission_enfant: "Prestation",
    });
    assert.equal(mapped.Mission, ref);
  });

  it("laisse Mission et Libelle vides si les colonnes sont absentes", () => {
    const mapped = missionEnfantFromGrist({});
    assert.equal(mapped.Mission, undefined);
    assert.equal(mapped.Libelle, undefined);
  });

  it("n’utilise pas un id numérique comme libellé (retombe sur Libelle)", () => {
    const mapped = missionEnfantFromGrist({
      Mission_enfant: 12,
      Libelle: "Alice — Design",
    });
    assert.equal(mapped.Libelle, "Alice — Design");
  });
});
