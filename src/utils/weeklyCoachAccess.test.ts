import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessWeeklyCoach,
  normalizeWeeklyCoachEmail,
  weeklyCoachEmailSetFromRows,
  weeklyOpsMembreOptions,
} from "./weeklyCoachAccess.ts";

describe("weeklyCoachAccess", () => {
  const coachEmails = weeklyCoachEmailSetFromRows([
    { E_mail: "Coach.One@example.com" },
    { E_mail: "  coach.two@example.com " },
    { E_mail: "" },
  ]);

  it("normalise et déduplique les e-mails issus de Weekly_coachs", () => {
    assert.equal(normalizeWeeklyCoachEmail("  A@B.Fr "), "a@b.fr");
    assert.equal(coachEmails.size, 2);
    assert.equal(coachEmails.has("coach.one@example.com"), true);
    assert.equal(coachEmails.has("coach.two@example.com"), true);
  });

  it("n’ouvre Weekly que si l’e-mail est dans la table (tout rôle)", () => {
    assert.equal(
      canAccessWeeklyCoach({
        email: "Coach.One@example.com",
        coachEmails,
      }),
      true,
    );
    assert.equal(
      canAccessWeeklyCoach({
        email: "admin.hors.liste@example.com",
        coachEmails,
      }),
      false,
    );
    assert.equal(
      canAccessWeeklyCoach({
        email: "autre@example.com",
        coachEmails: new Set(),
      }),
      false,
    );
  });

  it("accepte un Admin listé et refuse un Invité hors liste", () => {
    assert.equal(
      canAccessWeeklyCoach({
        email: "coach.two@example.com",
        coachEmails,
      }),
      true,
    );
    assert.equal(
      canAccessWeeklyCoach({
        email: "invite@example.com",
        coachEmails,
      }),
      false,
    );
  });

  it("filtre les options membre Ops via e-mails Weekly_coachs", () => {
    const opts = weeklyOpsMembreOptions(
      [
        { id: 1, Prenom_Nom: "Alice", E_mail: "coach.one@example.com" },
        { id: 2, Prenom_Nom: "Bob", E_mail: "hors@example.com" },
        { id: 3, Prenom_Nom: "Carol", E_mail: "Coach.Two@example.com" },
        { id: 4, Prenom_Nom: "Sans mail" },
      ],
      coachEmails,
    );
    assert.deepEqual(
      opts.map((o) => o.id),
      [1, 3],
    );
  });
});
