import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWritableUpdateTableId,
  isWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  buildMissionEnfantCreateFields,
  buildMissionEnfantPatch,
  dateInputToGristTimestamp,
  DEFAULT_MISSION_ENFANT_STATUT,
  DEFAULT_MISSION_ENFANT_TYPE,
  emptyMissionEnfantForm,
  gristTimestampToDateInput,
  missionEnfantToFormValues,
} from "./missionEnfantFormFields.ts";
import type { MissionEnfant } from "../types.ts";

describe("writeTableAllowlist update", () => {
  it("autorise update Missions et Missions_enfants", () => {
    assert.equal(isWritableUpdateTableId("Missions"), true);
    assert.equal(isWritableUpdateTableId("Missions_enfants"), true);
    assert.equal(isWritableUpdateTableId("Retours"), false);
    assert.throws(() => assertWritableUpdateTableId("Retours"), /non autorisée/);
  });
});

describe("grist date input helpers", () => {
  it("round-trip local date", () => {
    const input = "2026-03-15";
    const ts = dateInputToGristTimestamp(input);
    assert.ok(ts != null && ts > 0);
    assert.equal(gristTimestampToDateInput(ts), input);
  });

  it("vide / invalide → null ou chaîne vide", () => {
    assert.equal(dateInputToGristTimestamp(""), null);
    assert.equal(dateInputToGristTimestamp("not-a-date"), null);
    assert.equal(gristTimestampToDateInput(undefined), "");
    assert.equal(gristTimestampToDateInput(0), "");
  });
});

describe("buildMissionEnfantCreateFields", () => {
  it("écrit parent, libellé fallback, type Freelance et statut défaut", () => {
    const fields = buildMissionEnfantCreateFields({
      masterId: 12,
      values: {
        ...emptyMissionEnfantForm(),
        Intervenant: "7",
        Libelle: "",
      },
      intervenantLabel: "Alice Dupont",
    });
    assert.equal(fields.Mission_parent, 12);
    assert.equal(fields.Libelle, "Alice Dupont");
    assert.equal(fields.Intervenant, 7);
    assert.equal(fields.Type_prestation, DEFAULT_MISSION_ENFANT_TYPE);
    assert.equal(fields.Statut, DEFAULT_MISSION_ENFANT_STATUT);
    assert.equal(fields.Jours_envisages, undefined);
    assert.equal(fields.Date_de_debut, undefined);
  });

  it("inclut jours et date de début optionnels", () => {
    const fields = buildMissionEnfantCreateFields({
      masterId: 1,
      values: {
        ...emptyMissionEnfantForm(),
        Intervenant: "3",
        Libelle: "Design",
        Jours_envisages: "12,5",
        Date_de_debut: "2026-01-10",
        Statut: "En pause",
      },
    });
    assert.equal(fields.Libelle, "Design");
    assert.equal(fields.Jours_envisages, 12.5);
    assert.equal(fields.Statut, "En pause");
    assert.equal(fields.Date_de_debut, dateInputToGristTimestamp("2026-01-10"));
    assert.equal(fields.Type_prestation, "Freelance_jours");
  });
});

describe("buildMissionEnfantPatch", () => {
  it("ne retourne que les champs modifiés et jamais le type", () => {
    const init = emptyMissionEnfantForm();
    init.Libelle = "A";
    init.Intervenant = "1";
    init.Statut = "En cours";
    init.Jours_envisages = "5";
    init.Date_de_debut = "2026-02-01";
    const values = { ...init, Libelle: "B", Statut: "En cours" };
    const patch = buildMissionEnfantPatch(values, init);
    assert.deepEqual(patch, { Libelle: "B" });
    assert.equal("Type_prestation" in patch, false);
    assert.equal("Mission_parent" in patch, false);
  });

  it("peut vider jours et date", () => {
    const init = emptyMissionEnfantForm();
    init.Jours_envisages = "3";
    init.Date_de_debut = "2026-03-01";
    const values = { ...init, Jours_envisages: "", Date_de_debut: "" };
    const patch = buildMissionEnfantPatch(values, init);
    assert.deepEqual(patch, { Jours_envisages: null, Date_de_debut: null });
  });

  it("missionEnfantToFormValues mappe date et intervenant", () => {
    const e: MissionEnfant = {
      id: 9,
      Libelle: "UX",
      Intervenant: 4,
      Statut: "Terminé",
      Jours_envisages: 8,
      Date_de_debut: dateInputToGristTimestamp("2025-11-20") ?? undefined,
    };
    const v = missionEnfantToFormValues(e);
    assert.equal(v.Libelle, "UX");
    assert.equal(v.Intervenant, "4");
    assert.equal(v.Statut, "Terminé");
    assert.equal(v.Jours_envisages, "8");
    assert.equal(v.Date_de_debut, "2025-11-20");
  });
});
