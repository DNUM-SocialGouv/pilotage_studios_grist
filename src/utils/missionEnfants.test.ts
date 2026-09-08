import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MissionEnfant } from "../types.ts";
import {
  enfantExpandPrimary,
  enfantsOfMaster,
  missionEnfantFromGrist,
  typePrestationLabel,
} from "./missionEnfants.ts";

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

describe("typePrestationLabel", () => {
  it("mappe Freelance_jours et vide vers Freelance", () => {
    assert.equal(typePrestationLabel("Freelance_jours"), "Freelance");
    assert.equal(typePrestationLabel(""), "Freelance");
    assert.equal(typePrestationLabel(undefined), "Freelance");
  });

  it("mappe Entreprise_forfait vers un libellé lisible", () => {
    assert.equal(typePrestationLabel("Entreprise_forfait"), "Entreprise (forfait)");
  });

  it("laisse une clé inconnue inchangée", () => {
    assert.equal(typePrestationLabel("Autre_type"), "Autre_type");
  });
});

describe("enfantExpandPrimary", () => {
  it("affiche le libellé et le hint si l’intervenant est distinct", () => {
    const e: MissionEnfant = { id: 1, Libelle: "Coaching Produit" };
    assert.deepEqual(enfantExpandPrimary(e, "David Koss"), {
      primary: "Coaching Produit",
      hint: "David Koss",
    });
  });

  it("n’affiche pas le hint si l’intervenant égale le libellé", () => {
    const e: MissionEnfant = { id: 1, Libelle: "David Koss" };
    assert.deepEqual(enfantExpandPrimary(e, "David Koss"), { primary: "David Koss" });
  });

  it("retombe sur un tiret si le libellé est vide", () => {
    const e: MissionEnfant = { id: 1 };
    assert.deepEqual(enfantExpandPrimary(e, "Alice"), { primary: "—", hint: "Alice" });
    assert.deepEqual(enfantExpandPrimary(e), { primary: "—" });
  });
});

describe("enfantsOfMaster", () => {
  it("filtre via Mission déjà mappé (ingest Mission_parent)", () => {
    const fromLive = missionEnfantFromGrist({
      Mission_parent: 51,
      Mission_enfant: "Coaching",
    });
    const enfants: MissionEnfant[] = [
      { id: 10, ...fromLive, Intervenant: 201 },
      { id: 11, Mission: 99, Intervenant: 202 },
    ];
    const ofMaster = enfantsOfMaster(enfants, 51);
    assert.equal(ofMaster.length, 1);
    assert.equal(ofMaster[0]?.id, 10);
  });
});
