import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EquipeMember } from "../types.ts";
import {
  DEFAULT_EQUIPE_STATUT,
  buildEquipeCreateFields,
  buildEquipeUpdateFields,
  emptyEquipeCreateForm,
  memberToEquipeFormValues,
  parseOptionalTjm,
} from "./equipeFormFields.ts";
import { isWritableUpdateTableId } from "../security/writeTableAllowlist.ts";

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
      E_mail: " Alice@Example.ORG ",
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

describe("memberToEquipeFormValues", () => {
  it("préremplit depuis une fiche Admin", () => {
    const member: EquipeMember = {
      id: 7,
      Prenom_Nom: " Alice Dupont ",
      E_mail: "Alice@Example.ORG",
      Equipe: "Design",
      Specialite: "UX",
      Statut: "Actif",
      Portage: "Malt",
      Ordinateur2: "Oui",
      Mode_recrutement: "AO",
      Role_ACL: "Freelance",
      TJM: 600,
    };
    assert.deepEqual(memberToEquipeFormValues(member), {
      Prenom_Nom: "Alice Dupont",
      E_mail: "alice@example.org",
      Equipe: "Design",
      Specialite: "UX",
      Statut: "Actif",
      Portage: "Malt",
      Ordinateur2: "Oui",
      Mode_recrutement: "AO",
      Role_ACL: "Freelance",
      TJM: "600",
    });
  });

  it("défaut statut Actif et TJM vide si absents", () => {
    const v = memberToEquipeFormValues({ id: 1, Prenom_Nom: "Bob" });
    assert.equal(v.Statut, DEFAULT_EQUIPE_STATUT);
    assert.equal(v.E_mail, "");
    assert.equal(v.TJM, "");
  });
});

describe("buildEquipeUpdateFields", () => {
  it("envoie les chaînes (y compris vides) et le TJM si renseigné", () => {
    const fields = buildEquipeUpdateFields({
      ...emptyEquipeCreateForm(),
      Prenom_Nom: "  Alice  ",
      E_mail: " Alice@X.fr ",
      Equipe: "Tech",
      Specialite: "",
      Portage: "",
      Role_ACL: "Admin",
      TJM: "450,5",
    });
    assert.deepEqual(fields, {
      Prenom_Nom: "Alice",
      E_mail: "alice@x.fr",
      Equipe: "Tech",
      Specialite: "",
      Statut: DEFAULT_EQUIPE_STATUT,
      Portage: "",
      Ordinateur2: "",
      Mode_recrutement: "",
      Role_ACL: "Admin",
      TJM: 450.5,
    });
  });

  it("omet TJM si le champ est vide (ne pas effacer)", () => {
    const fields = buildEquipeUpdateFields({
      ...emptyEquipeCreateForm(),
      Prenom_Nom: "Alice",
      E_mail: "a@b.fr",
      TJM: "",
    });
    assert.equal("TJM" in fields, false);
  });
});

describe("write allowlist Equipe update", () => {
  it("autorise Equipe en update", () => {
    assert.equal(isWritableUpdateTableId("Equipe"), true);
  });
});
