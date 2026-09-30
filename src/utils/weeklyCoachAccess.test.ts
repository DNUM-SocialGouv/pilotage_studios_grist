import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessWeeklyCoach,
  normalizeWeeklyCoachEmail,
  weeklyCoachEmailSetFromRows,
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

  it("ouvre Weekly pour Admin et Responsable sans allowlist", () => {
    const empty = new Set<string>();
    assert.equal(
      canAccessWeeklyCoach({
        role: "Admin",
        email: "x@example.com",
        coachEmails: empty,
      }),
      true,
    );
    assert.equal(
      canAccessWeeklyCoach({
        role: "Responsable de département",
        email: "y@example.com",
        coachEmails: empty,
      }),
      true,
    );
  });

  it("restreint Freelance à l’ensemble fourni (données Grist)", () => {
    assert.equal(
      canAccessWeeklyCoach({
        role: "Freelance",
        email: "Coach.One@example.com",
        coachEmails,
      }),
      true,
    );
    assert.equal(
      canAccessWeeklyCoach({
        role: "Freelance",
        email: "autre@example.com",
        coachEmails,
      }),
      false,
    );
  });

  it("refuse Invité même présent dans l’ensemble", () => {
    assert.equal(
      canAccessWeeklyCoach({
        role: "Invité",
        email: "coach.one@example.com",
        coachEmails,
      }),
      false,
    );
  });
});
