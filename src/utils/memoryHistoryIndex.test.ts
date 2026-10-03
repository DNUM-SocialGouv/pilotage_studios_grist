import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canGoBackFromHistoryIndex,
  readMemoryHistoryIndex,
} from "./memoryHistoryIndex.ts";

describe("memoryHistoryIndex", () => {
  it("désactive le Retour sur la première entrée (index 0)", () => {
    assert.equal(canGoBackFromHistoryIndex(0), false);
    assert.equal(canGoBackFromHistoryIndex(null), false);
    assert.equal(canGoBackFromHistoryIndex(undefined), false);
  });

  it("autorise le Retour dès qu’il y a une entrée derrière", () => {
    assert.equal(canGoBackFromHistoryIndex(1), true);
    assert.equal(canGoBackFromHistoryIndex(3), true);
  });

  it("lit l’index MemoryHistory sans planter sur un navigator sans index", () => {
    assert.equal(readMemoryHistoryIndex({ index: 2 }), 2);
    assert.equal(readMemoryHistoryIndex({ go: () => undefined }), null);
    assert.equal(readMemoryHistoryIndex({ index: "x" }), null);
  });
});
