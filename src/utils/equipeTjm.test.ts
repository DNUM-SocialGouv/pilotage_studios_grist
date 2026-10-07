import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyEquipeTjmDraftLine,
  periodsOverlapInclusive,
  validateEquipeTjmDrafts,
  toEquipeTjmRow,
  isEquipeTjmOpen,
  sortEquipeTjmRows,
} from "./equipeTjm.ts";
import { dateInputToGristTimestamp } from "./missionEnfantFormFields.ts";
import {
  isAllowlistedTableId,
} from "../security/fetchTableAllowlist.ts";
import {
  isWritableTableId,
  isWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";

describe("Equipe_TJM allowlists", () => {
  it("autorise lecture et écriture", () => {
    assert.equal(isAllowlistedTableId("Equipe_TJM"), true);
    assert.equal(isWritableTableId("Equipe_TJM"), true);
    assert.equal(isWritableUpdateTableId("Equipe_TJM"), true);
  });
});

describe("periodsOverlapInclusive", () => {
  const d = (iso: string) => dateInputToGristTimestamp(iso)!;

  it("détecte chevauchement ouvert / fermé", () => {
    assert.equal(
      periodsOverlapInclusive(d("2025-01-01"), d("2025-09-14"), d("2025-09-15"), null),
      false,
    );
    assert.equal(
      periodsOverlapInclusive(d("2025-01-01"), d("2025-09-15"), d("2025-09-15"), null),
      true,
    );
    assert.equal(
      periodsOverlapInclusive(d("2025-01-01"), null, d("2025-06-01"), d("2025-07-01")),
      true,
    );
  });
});

describe("validateEquipeTjmDrafts", () => {
  it("accepte deux spécialités ouvertes", () => {
    const a = emptyEquipeTjmDraftLine();
    a.Specialite = "RU";
    a.TJM = "700";
    a.Date_debut = "2025-01-01";
    const b = emptyEquipeTjmDraftLine();
    b.Specialite = "Access.";
    b.TJM = "600";
    b.Date_debut = "2025-01-01";
    const r = validateEquipeTjmDrafts(12, [a, b]);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.writes.length, 2);
    }
  });

  it("refuse chevauchement même spécialité", () => {
    const a = emptyEquipeTjmDraftLine();
    a.Specialite = "RU";
    a.TJM = "700";
    a.Date_debut = "2025-01-01";
    const b = emptyEquipeTjmDraftLine();
    b.Specialite = "RU";
    b.TJM = "650";
    b.Date_debut = "2025-09-01";
    const r = validateEquipeTjmDrafts(12, [a, b]);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /Chevauchement/);
    }
  });

  it("exige date de début", () => {
    const a = emptyEquipeTjmDraftLine();
    a.Specialite = "Design";
    a.TJM = "750";
    const r = validateEquipeTjmDrafts(1, [a]);
    assert.equal(r.ok, false);
  });
});

describe("toEquipeTjmRow / open / sort", () => {
  it("mappe et trie", () => {
    const row = toEquipeTjmRow({
      id: 3,
      Personne: 9,
      Specialite: "RU",
      TJM: 700,
      Date_debut: dateInputToGristTimestamp("2025-01-01"),
      Date_fin: null,
    });
    assert.ok(row);
    assert.equal(row!.Personne, 9);
    assert.equal(isEquipeTjmOpen(row!), true);

    const closed = toEquipeTjmRow({
      id: 2,
      Personne: 9,
      Specialite: "Design",
      TJM: 500,
      Date_debut: dateInputToGristTimestamp("2024-01-01"),
      Date_fin: dateInputToGristTimestamp("2024-06-01"),
    })!;
    assert.equal(isEquipeTjmOpen(closed), false);

    const sorted = sortEquipeTjmRows([row!, closed]);
    assert.equal(sorted[0]!.Specialite, "Design");
  });
});
