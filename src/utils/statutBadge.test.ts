import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { severityForStatut } from "./statutBadge.ts";

describe("severityForStatut", () => {
  it("mappe En cours vers new", () => {
    assert.equal(severityForStatut("En cours"), "new");
    assert.equal(severityForStatut("EN COURS"), "new");
  });

  it("mappe soldé vers success", () => {
    assert.equal(severityForStatut("Soldé"), "success");
  });

  it("mappe annulé vers error", () => {
    assert.equal(severityForStatut("Annulé"), "error");
  });

  it("retombe sur info (Terminé, vide)", () => {
    assert.equal(severityForStatut("Terminé"), "info");
    assert.equal(severityForStatut(undefined), "info");
    assert.equal(severityForStatut(""), "info");
  });
});
