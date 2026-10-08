import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WeeklyAgendaRow } from "../types.ts";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  formatWeeklyAgendaDayLong,
  formatWeeklyAgendaDayShort,
  groupWeeklyAgendaHistory,
  prenomFromEmailLocalPart,
  weeklyAgendaAuteurPrenom,
  weeklyAgendaDayKey,
} from "./weeklyAgenda.ts";
import { weeklyAgendaTraiteLeTimestamp } from "./weeklyGristWrite.ts";

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

describe("weeklyAgendaTraiteLeTimestamp", () => {
  it("retourne minuit local en secondes", () => {
    const now = new Date(2026, 9, 8, 17, 30, 0);
    const ts = weeklyAgendaTraiteLeTimestamp(now);
    const back = new Date(ts * 1000);
    assert.equal(back.getFullYear(), 2026);
    assert.equal(back.getMonth(), 9);
    assert.equal(back.getDate(), 8);
    assert.equal(back.getHours(), 0);
  });
});

describe("groupWeeklyAgendaHistory", () => {
  it("ignore les sujets non traités", () => {
    const agenda: WeeklyAgendaRow[] = [
      { id: 1, Texte: "Ouvert", Traite: false },
      {
        id: 2,
        Texte: "Fait",
        Traite: true,
        Traite_le: weeklyAgendaTraiteLeTimestamp(new Date(2026, 8, 25)),
      },
    ];
    const months = groupWeeklyAgendaHistory(agenda);
    assert.equal(months.length, 1);
    assert.equal(months[0]!.sujetCount, 1);
    assert.equal(months[0]!.days[0]!.sujets[0]!.id, 2);
  });

  it("groupe par jour exact de Traite_le (pas vendredi forcé)", () => {
    const mercredi = new Date(2026, 8, 23); // mer. 23 sept 2026
    const vendredi = new Date(2026, 8, 25);
    const agenda: WeeklyAgendaRow[] = [
      {
        id: 1,
        Texte: "A",
        Traite: true,
        Traite_le: weeklyAgendaTraiteLeTimestamp(mercredi),
      },
      {
        id: 2,
        Texte: "B",
        Traite: true,
        Traite_le: weeklyAgendaTraiteLeTimestamp(vendredi),
      },
    ];
    const months = groupWeeklyAgendaHistory(agenda);
    assert.equal(months.length, 1);
    assert.equal(months[0]!.days.length, 2);
    assert.equal(months[0]!.days[0]!.dayKey, weeklyAgendaDayKey(vendredi));
    assert.equal(months[0]!.days[1]!.dayKey, weeklyAgendaDayKey(mercredi));
  });

  it("fallback Cree_le si Traite_le absent", () => {
    const cree = new Date(2026, 7, 14, 10, 0, 0);
    const agenda: WeeklyAgendaRow[] = [
      {
        id: 3,
        Texte: "Legacy",
        Traite: true,
        Traite_le: null,
        Cree_le: cree.toISOString(),
      },
    ];
    const months = groupWeeklyAgendaHistory(agenda);
    assert.equal(months[0]!.days[0]!.dayKey, weeklyAgendaDayKey(cree));
  });

  it("bucket sans date si aucune date", () => {
    const months = groupWeeklyAgendaHistory([
      { id: 4, Texte: "Orphelin", Traite: true },
    ]);
    assert.equal(months[0]!.monthKey, "sans-date");
    assert.equal(months[0]!.days[0]!.labelShort, "Sans date");
  });
});

describe("formatWeeklyAgendaDay*", () => {
  it("produit un libellé long accessible", () => {
    const d = new Date(2026, 8, 25);
    assert.match(formatWeeklyAgendaDayLong(d), /25/);
    assert.match(formatWeeklyAgendaDayLong(d), /2026/);
    assert.ok(formatWeeklyAgendaDayShort(d).length > 0);
  });
});
