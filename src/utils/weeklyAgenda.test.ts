import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  prenomFromEmailLocalPart,
  weeklyAgendaAuteurPrenom,
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
  const now = new Date(2026, 9, 4, 15, 0, 0); // 4 oct. 2026 local

  it("DATETIME Grist (secondes) → relatif FR", () => {
    // 2026-10-03 12:00:00 UTC ≈ hier / aujourd'hui selon fuseau — on fixe via ISO locale
    const yesterdayLocal = new Date(2026, 9, 3, 12, 0, 0);
    const seconds = yesterdayLocal.getTime() / 1000;
    assert.equal(formatWeeklyAgendaCreatedAt(seconds, now), "hier");
  });

  it("accepte une ISO string", () => {
    const todayLocal = new Date(2026, 9, 4, 9, 0, 0);
    assert.equal(
      formatWeeklyAgendaCreatedAt(todayLocal.toISOString(), now),
      "aujourd'hui",
    );
  });

  it("vide si absent", () => {
    assert.equal(formatWeeklyAgendaCreatedAt(undefined, now), "");
    assert.equal(formatWeeklyAgendaCreatedAt("", now), "");
  });
});

describe("weeklyAgendaAuteurPrenom", () => {
  it("garde un prénom seul", () => {
    assert.equal(weeklyAgendaAuteurPrenom("Olivier"), "Olivier");
  });

  it("extrait le prénom d’un nom complet", () => {
    assert.equal(weeklyAgendaAuteurPrenom("Olivier Toumsy"), "Olivier");
  });

  it("secours tiret", () => {
    assert.equal(weeklyAgendaAuteurPrenom(""), "—");
    assert.equal(weeklyAgendaAuteurPrenom(null), "—");
  });
});
