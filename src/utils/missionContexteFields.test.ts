import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission } from "../types.ts";
import {
  MISSION_CONTEXTE_KEYS,
  buildContextePatch,
  emptyMissionContexteDraft,
  hasAnyContexteNarrative,
  missionToContexteDraft,
} from "./missionContexteFields.ts";

describe("missionContexteFields", () => {
  it("MISSION_CONTEXTE_KEYS couvre les 7 champs narratifs", () => {
    assert.equal(MISSION_CONTEXTE_KEYS.length, 7);
  });

  it("missionToContexteDraft normalise les absents en chaîne vide", () => {
    const draft = missionToContexteDraft({ id: 1 } as Mission);
    assert.deepEqual(draft, emptyMissionContexteDraft());
  });

  it("missionToContexteDraft reprend les textes existants", () => {
    const draft = missionToContexteDraft({
      id: 2,
      Demande: "  hello  ",
      Enjeux: "enjeux",
    } as Mission);
    assert.equal(draft.Demande, "  hello  ");
    assert.equal(draft.Enjeux, "enjeux");
    assert.equal(draft.Historique, "");
  });

  it("hasAnyContexteNarrative ignore les chaînes blanches", () => {
    assert.equal(hasAnyContexteNarrative({ id: 1 } as Mission), false);
    assert.equal(
      hasAnyContexteNarrative({ id: 1, Demande: "   " } as Mission),
      false,
    );
    assert.equal(
      hasAnyContexteNarrative({ id: 1, Demande: "x" } as Mission),
      true,
    );
  });

  it("buildContextePatch ne retourne que les champs modifiés", () => {
    const initial = emptyMissionContexteDraft();
    initial.Demande = "A";
    initial.Enjeux = "B";
    const draft = { ...initial, Demande: "A2" };
    assert.deepEqual(buildContextePatch(draft, initial), { Demande: "A2" });
  });

  it("buildContextePatch autorise de vider un champ", () => {
    const initial = emptyMissionContexteDraft();
    initial.Historique = "avant";
    const draft = { ...initial, Historique: "" };
    assert.deepEqual(buildContextePatch(draft, initial), { Historique: "" });
  });

  it("buildContextePatch retourne un objet vide si rien n’a changé", () => {
    const initial = emptyMissionContexteDraft();
    initial.Demande = "x";
    assert.deepEqual(buildContextePatch({ ...initial }, initial), {});
  });
});
