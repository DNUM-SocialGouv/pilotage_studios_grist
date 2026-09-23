import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGristAttachmentsList,
  extractGristAttachmentIds,
  mergeAttachmentIds,
  parseUploadedAttachmentIds,
  validateMissionDocFile,
} from "./gristAttachments.ts";

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

describe("buildGristAttachmentsList", () => {
  it("construit une liste L et déduplique", () => {
    assert.deepEqual(buildGristAttachmentsList([12, 12, 7]), ["L", 12, 7]);
  });

  it("retourne null si vide", () => {
    assert.equal(buildGristAttachmentsList([]), null);
    assert.equal(buildGristAttachmentsList([0, -1]), null);
  });
});

describe("validateMissionDocFile", () => {
  it("accepte un PDF sous 20 Mo", () => {
    const file = new File([new Uint8Array(10)], "note.pdf", { type: "application/pdf" });
    assert.equal(validateMissionDocFile(file), null);
  });

  it("refuse une extension inconnue", () => {
    const file = new File([new Uint8Array(10)], "virus.exe", {
      type: "application/octet-stream",
    });
    assert.match(validateMissionDocFile(file) ?? "", /non accepté/);
  });

  it("refuse un fichier trop gros", () => {
    const file = new File([new Uint8Array(21 * 1024 * 1024)], "gros.pdf", {
      type: "application/pdf",
    });
    assert.match(validateMissionDocFile(file) ?? "", /20 Mo/);
  });
});

describe("parseUploadedAttachmentIds", () => {
  it("lit un tableau de nombres", () => {
    assert.deepEqual(parseUploadedAttachmentIds([12, 3]), [12, 3]);
  });

  it("accepte des ids en string", () => {
    assert.deepEqual(parseUploadedAttachmentIds(["7"]), [7]);
  });

  it("ignore le reste", () => {
    assert.deepEqual(parseUploadedAttachmentIds(null), []);
    assert.deepEqual(parseUploadedAttachmentIds({}), []);
    assert.deepEqual(parseUploadedAttachmentIds([0, -1, "x"]), []);
  });
});

describe("mergeAttachmentIds", () => {
  it("conserve l’ordre et déduplique", () => {
    assert.deepEqual(mergeAttachmentIds([1, 2], [2, 3]), [1, 2, 3]);
  });

  it("ignore les ids invalides", () => {
    assert.deepEqual(mergeAttachmentIds([1], [0, -2, 4]), [1, 4]);
  });
});
