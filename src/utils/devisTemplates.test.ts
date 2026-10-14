import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEVIS_PROFIL_MAX_SELECTION,
  mergeDevisProfilTemplates,
} from "./devisPorteurs/templates.ts";

describe("mergeDevisProfilTemplates", () => {
  it("préremplit un profil PM", () => {
    const merged = mergeDevisProfilTemplates(["pm"]);
    assert.ok(merged.demandeContexte.length > 0);
    assert.ok(merged.livrablesAttendus.length > 0);
    assert.ok(merged.uoCodesSuggeres.includes("UO L4 - P - 6.1"));
    assert.deepEqual(merged.equipesSuggerees, ["Product"]);
  });

  it("fusionne jusqu’à DEVIS_PROFIL_MAX_SELECTION profils", () => {
    assert.equal(DEVIS_PROFIL_MAX_SELECTION, 2);
    const merged = mergeDevisProfilTemplates(["pm", "ru"]);
    assert.ok(merged.demandeContexte.includes("PM") || merged.demandeContexte.length > 20);
    assert.ok(merged.equipesSuggerees.includes("Product"));
    assert.ok(merged.equipesSuggerees.includes("RU"));
    const uoSet = new Set(merged.uoCodesSuggeres);
    assert.equal(uoSet.size, merged.uoCodesSuggeres.length);
  });

  it("ignore les ids inconnus", () => {
    const merged = mergeDevisProfilTemplates(["inconnu"]);
    assert.equal(merged.demandeContexte, "");
    assert.deepEqual(merged.uoCodesSuggeres, []);
  });
});
