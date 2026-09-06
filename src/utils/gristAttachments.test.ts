import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractGristAttachmentIds } from "./gristAttachments.ts";

describe("extractGristAttachmentIds", () => {
  it("accepte [\"L\", id]", () => {
    assert.deepEqual(extractGristAttachmentIds(["L", 44]), [44]);
  });

  it("accepte un tableau d’ids déjà décodé", () => {
    assert.deepEqual(extractGristAttachmentIds([44, 12]), [44, 12]);
  });

  it("accepte la forme texte SQL \"[44]\"", () => {
    assert.deepEqual(extractGristAttachmentIds("[44]"), [44]);
  });

  it("accepte un id seul", () => {
    assert.deepEqual(extractGristAttachmentIds(7), [7]);
  });

  it("ignore null / vide / CENSORED", () => {
    assert.deepEqual(extractGristAttachmentIds(null), []);
    assert.deepEqual(extractGristAttachmentIds(""), []);
    assert.deepEqual(extractGristAttachmentIds("CENSORED"), []);
  });
});
