import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  prenomFromEmailLocalPart,
} from "./weeklyAgenda.ts";

describe("prenomFromEmailLocalPart", () => {
  it("prend le segment avant le point (pas prenom.nom)", () => {
    assert.equal(prenomFromEmailLocalPart("olivier.toumsy@sg.social.gouv.fr"), "Olivier");
    assert.equal(prenomFromEmailLocalPart("nathalie.molines@example.com"), "Nathalie");
  });

  it("gère local-part simple ou séparateurs", () => {
    assert.equal(prenomFromEmailLocalPart("alice@example.com"), "Alice");
    assert.equal(prenomFromEmailLocalPart("jean_dupont@example.com"), "Jean");
  });

  it("retourne null si e-mail vide", () => {
    assert.equal(prenomFromEmailLocalPart(null), null);
    assert.equal(prenomFromEmailLocalPart(""), null);
  });
});

describe("defaultWeeklyAuteurPrenom", () => {
  it("préfère Equipe.Prenom_Nom (premier mot)", () => {
    assert.equal(
      defaultWeeklyAuteurPrenom("Olivier Toumsy", "olivier.toumsy@sg.social.gouv.fr"),
      "Olivier",
    );
    assert.equal(
      defaultWeeklyAuteurPrenom("TOUMSY Olivier", "olivier.toumsy@sg.social.gouv.fr"),
      "Olivier",
    );
  });

  it("secours : prénom depuis e-mail session", () => {
    assert.equal(
      defaultWeeklyAuteurPrenom(null, "olivier.toumsy@sg.social.gouv.fr"),
      "Olivier",
    );
  });

  it("vide si aucune source", () => {
    assert.equal(defaultWeeklyAuteurPrenom(null, null), "");
  });
});

describe("formatWeeklyAgendaCreatedAt", () => {
  it("formate un DATETIME Grist (secondes)", () => {
    // 2026-10-04 ≈ — on vérifie juste un format fr-FR non vide
    const label = formatWeeklyAgendaCreatedAt(1_791_144_157.112);
    assert.match(label, /^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("accepte une ISO string", () => {
    const label = formatWeeklyAgendaCreatedAt("2026-10-04T10:00:00.000Z");
    assert.match(label, /^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });

  it("vide si absent", () => {
    assert.equal(formatWeeklyAgendaCreatedAt(undefined), "");
    assert.equal(formatWeeklyAgendaCreatedAt(""), "");
  });
});
