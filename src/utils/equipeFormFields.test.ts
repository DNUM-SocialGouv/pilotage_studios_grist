import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_EQUIPE_STATUT,
  buildEquipeCreateFields,
  emptyEquipeCreateForm,
  parseOptionalTjm,
} from "./equipeFormFields.ts";

describe("emptyEquipeCreateForm", () => {
  it("préremplit le statut Actif", () => {
    const f = emptyEquipeCreateForm();
    assert.equal(f.Statut, DEFAULT_EQUIPE_STATUT);
    assert.equal(f.Prenom_Nom, "");
    assert.equal(f.E_mail, "");
    assert.equal(f.TJM, "");
  });
});

describe("parseOptionalTjm", () => {
  it("accepte vide, nombre et virgule", () => {
    assert.equal(parseOptionalTjm(""), null);
    assert.equal(parseOptionalTjm("  "), null);
    assert.equal(parseOptionalTjm("600"), 600);
    assert.equal(parseOptionalTjm("280,5"), 280.5);
  });

  it("refuse négatif ou non numérique", () => {
    assert.equal(parseOptionalTjm("-1"), "invalid");
    assert.equal(parseOptionalTjm("abc"), "invalid");
  });
});

describe("buildEquipeCreateFields", () => {
  it("impose Prenom_Nom et E_mail trimés ; omet les vides", () => {
    const fields = buildEquipeCreateFields({
      ...emptyEquipeCreateForm(),
      Prenom_Nom: "  Alice Dupont  ",
      E_mail: " alice@example.org ",
      Equipe: "Design",
      Specialite: "",
      Portage: "Malt",
      Role_ACL: "Freelance",
      TJM: "600",
    });
    assert.deepEqual(fields, {
      Prenom_Nom: "Alice Dupont",
      E_mail: "alice@example.org",
      Equipe: "Design",
      Statut: DEFAULT_EQUIPE_STATUT,
      Portage: "Malt",
      Role_ACL: "Freelance",
      TJM: 600,
    });
  });

  it("n’envoie pas TJM invalide ou vide", () => {
    const emptyTjm = buildEquipeCreateFields({
      ...emptyEquipeCreateForm(),
      Prenom_Nom: "Bob",
      E_mail: "bob@example.org",
      TJM: "",
    });
    assert.equal("TJM" in emptyTjm, false);

    const bad = buildEquipeCreateFields({
      ...emptyEquipeCreateForm(),
      Prenom_Nom: "Bob",
      E_mail: "bob@example.org",
      TJM: "nope",
    });
    assert.equal("TJM" in bad, false);
  });
});
