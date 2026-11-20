import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GristRecord } from "../gristTypes.ts";
import { dateInputToGristTimestamp } from "./missionEnfantFormFields.ts";
import {
  PORTAGE_VALEUR_A_CORRIGER,
  assertPortageProjetDeletable,
  buildPortageProjetCreateFields,
  buildPortageProjetPatch,
  countPrestationsLinkedToPortage,
  displayPortageField,
  emptyPortageProjetForm,
  filterPortageProjetAdminRows,
  portageDeleteBlockMessage,
  portageProjetAdminFromRecord,
} from "./portageProjetFormFields.ts";

const labels = {
  personLabel: (id: string) => (id === "10" ? "Ada Lovelace" : `Personne #${id}`),
  bdcLabel: (id: string) => `BDC ${id}`,
};

describe("portageProjetAdminFromRecord", () => {
  it("lit les scalaires et ignore un texte de référence invalide", () => {
    const record: GristRecord = {
      id: 49,
      Nom_du_projet: "\nMission FALC\n",
      Statut: "Terminé",
      Porteur: "Malt",
      Financeur: ["E", "InvalidTypedValue"],
      Equipe: "Access.",
      Freelance: 114,
      Responsable_du_projet: 43,
      Bon_de_commande: "\n1407024492\n",
      Date_de_debut: dateInputToGristTimestamp("2026-02-18"),
      Date_de_fin: ["E", "InvalidTypedValue"],
    };
    const row = portageProjetAdminFromRecord(record);
    assert.equal(row.values.Nom_du_projet, "Mission FALC");
    assert.equal(row.values.Freelance, "114");
    assert.equal(row.values.Bon_de_commande, "");
    assert.equal(row.values.Financeur, "");
    assert.equal(row.values.Date_de_debut, "2026-02-18");
    assert.equal(row.values.Date_de_fin, "");
    assert.equal(row.invalid.has("Financeur"), true);
    assert.equal(row.invalid.has("Bon_de_commande"), true);
    assert.equal(row.invalid.has("Date_de_fin"), true);
    assert.equal(row.invalid.has("Freelance"), false);
    assert.equal(displayPortageField(row, "Financeur"), PORTAGE_VALEUR_A_CORRIGER);
  });

  it("accepte une référence tuple et une date vide", () => {
    const record: GristRecord = {
      id: 12,
      Nom_du_projet: "Mission UX",
      Freelance: ["R", "Equipe", 101],
      Bon_de_commande: 0,
      Date_de_debut: null,
    };
    const row = portageProjetAdminFromRecord(record);
    assert.equal(row.values.Freelance, "101");
    assert.equal(row.values.Bon_de_commande, "");
    assert.equal(row.values.Date_de_debut, "");
    assert.equal(row.invalid.size, 0);
  });
});

describe("buildPortageProjetCreateFields", () => {
  it("n’envoie que le nom et les champs remplis", () => {
    const values = {
      ...emptyPortageProjetForm(),
      Nom_du_projet: "  Nouveau projet  ",
      Porteur: "Malt",
      Freelance: "10",
      Date_de_debut: "2026-03-01",
    };
    const fields = buildPortageProjetCreateFields(values);
    assert.equal(fields.Nom_du_projet, "Nouveau projet");
    assert.equal(fields.Porteur, "Malt");
    assert.equal(fields.Freelance, 10);
    assert.equal(fields.Date_de_debut, dateInputToGristTimestamp("2026-03-01"));
    assert.equal("Statut" in fields, false);
    assert.equal("Financeur" in fields, false);
    assert.equal("Bon_de_commande" in fields, false);
  });

  it("refuse un nom vide", () => {
    assert.throws(
      () => buildPortageProjetCreateFields(emptyPortageProjetForm()),
      /obligatoire/,
    );
  });
});

describe("buildPortageProjetPatch", () => {
  it("ne réécrit pas une cellule illisible laissée vide", () => {
    const init = {
      ...emptyPortageProjetForm(),
      Nom_du_projet: "Mission FALC",
      Statut: "Terminé",
    };
    const values = { ...init, Statut: "En cours" };
    const invalid = new Set(["Financeur" as const, "Bon_de_commande" as const]);
    const patch = buildPortageProjetPatch(values, init, invalid);
    assert.deepEqual(patch, { Statut: "En cours" });
  });

  it("remplace une cellule illisible seulement si une valeur est choisie", () => {
    const init = { ...emptyPortageProjetForm(), Nom_du_projet: "Mission" };
    const values = { ...init, Freelance: "10", Financeur: "DNUM - SPC" };
    const invalid = new Set(["Freelance" as const, "Financeur" as const]);
    const patch = buildPortageProjetPatch(values, init, invalid);
    assert.deepEqual(patch, { Freelance: 10, Financeur: "DNUM - SPC" });
  });

  it("vide un champ lisible qui a été effacé", () => {
    const init = {
      ...emptyPortageProjetForm(),
      Nom_du_projet: "Mission",
      Porteur: "Malt",
      Freelance: "10",
      Date_de_fin: "2026-06-01",
    };
    const values = {
      ...init,
      Porteur: "",
      Freelance: "",
      Date_de_fin: "",
    };
    const patch = buildPortageProjetPatch(values, init);
    assert.deepEqual(patch, {
      Porteur: null,
      Freelance: 0,
      Date_de_fin: null,
    });
  });
});

describe("suppression liée aux prestations", () => {
  const prestations = [
    { Portage_Projet: 12 },
    { Portage_Projet: 12 },
    { Portage_Projet: 0 },
    { Portage_Projet: ["R", "Portage_Projet", 4] },
  ];

  it("compte les rattachements", () => {
    assert.equal(countPrestationsLinkedToPortage(prestations, 12), 2);
    assert.equal(countPrestationsLinkedToPortage(prestations, 4), 1);
    assert.equal(countPrestationsLinkedToPortage(prestations, 99), 0);
  });

  it("refuse la suppression s’il reste un rattachement", () => {
    assert.throws(
      () => assertPortageProjetDeletable(1),
      /Une prestation est encore rattachée à ce projet/,
    );
    assert.match(portageDeleteBlockMessage(3), /3 prestations/);
    assert.doesNotThrow(() => assertPortageProjetDeletable(0));
  });
});

describe("filterPortageProjetAdminRows", () => {
  it("filtre sur le nom, la personne et la mention à corriger", () => {
    const malt = portageProjetAdminFromRecord({
      id: 1,
      Nom_du_projet: "Mission UX",
      Porteur: "Malt",
      Freelance: 10,
    });
    const sale = portageProjetAdminFromRecord({
      id: 2,
      Nom_du_projet: "Audit",
      Financeur: ["E", "InvalidTypedValue"],
    });
    const rows = [malt, sale];
    assert.equal(filterPortageProjetAdminRows(rows, "ada", labels).length, 1);
    assert.equal(filterPortageProjetAdminRows(rows, "corriger", labels)[0]?.id, 2);
    assert.equal(filterPortageProjetAdminRows(rows, "", labels).length, 2);
  });
});
