import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calendarDaysBetween,
  formatRelativeDateFr,
} from "./formatRelativeDateFr.ts";

const now = new Date(2026, 9, 4, 15, 30, 0); // 4 oct. 2026 local

function daysAgo(n: number): Date {
  return new Date(2026, 9, 4 - n, 10, 0, 0);
}

describe("calendarDaysBetween", () => {
  it("compte les jours calendaires locaux", () => {
    assert.equal(calendarDaysBetween(daysAgo(0), now), 0);
    assert.equal(calendarDaysBetween(daysAgo(1), now), 1);
    assert.equal(calendarDaysBetween(daysAgo(3), now), 3);
  });
});

describe("formatRelativeDateFr", () => {
  it("aujourd'hui / hier", () => {
    assert.equal(formatRelativeDateFr(daysAgo(0), now), "aujourd'hui");
    assert.equal(formatRelativeDateFr(daysAgo(1), now), "hier");
  });

  it("jours puis semaines", () => {
    assert.equal(formatRelativeDateFr(daysAgo(2), now), "il y a 2 jours");
    assert.equal(formatRelativeDateFr(daysAgo(6), now), "il y a 6 jours");
    assert.equal(formatRelativeDateFr(daysAgo(7), now), "il y a 1 semaine");
    assert.equal(formatRelativeDateFr(daysAgo(13), now), "il y a 1 semaine");
    assert.equal(formatRelativeDateFr(daysAgo(14), now), "il y a 2 semaines");
    assert.equal(formatRelativeDateFr(daysAgo(21), now), "il y a 3 semaines");
  });

  it("mois puis années", () => {
    assert.equal(formatRelativeDateFr(daysAgo(30), now), "il y a 1 mois");
    assert.equal(formatRelativeDateFr(daysAgo(60), now), "il y a 2 mois");
    assert.equal(formatRelativeDateFr(daysAgo(365), now), "il y a 1 an");
    assert.equal(formatRelativeDateFr(daysAgo(800), now), "il y a 2 ans");
  });

  it("date future → secours fr-FR court", () => {
    const future = new Date(2026, 9, 10, 12, 0, 0);
    const label = formatRelativeDateFr(future, now);
    assert.match(label, /^\d{1,2}\/\d{1,2}\/\d{4}$/);
  });
});
