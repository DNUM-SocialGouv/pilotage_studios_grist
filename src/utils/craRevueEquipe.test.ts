import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EquipeMember, SuiviMensuel } from "../types.ts";
import {
  buildCraRevueEquipeSaveRows,
  buildRealiseRevueEquipeFields,
  craRevueEquipeTeamKpis,
  filterEquipeMembersByDepartement,
  filterSuiviForIntervenantMonth,
  initCraRevueEquipeDrafts,
  suiviSansBdc,
} from "./craRevueEquipe.ts";

const SEPT_2026 = Math.floor(Date.UTC(2026, 8, 1) / 1000);
const AOUT_2026 = Math.floor(Date.UTC(2026, 7, 1) / 1000);

function member(partial: Partial<EquipeMember> & { id: number }): EquipeMember {
  return {
    Prenom_Nom: `Pers ${partial.id}`,
    Equipe: "Design",
    ...partial,
  };
}

function suivi(partial: Partial<SuiviMensuel> & { id: number }): SuiviMensuel {
  return {
    Intervenants: 1,
    Periode: SEPT_2026,
    Nb_jours: 2,
    Taches_realisees: "Travail",
    ...partial,
  };
}

describe("filterEquipeMembersByDepartement", () => {
  it("filtre même département hors soi", () => {
    const list = filterEquipeMembersByDepartement(
      [
        member({ id: 1, Prenom_Nom: "Manager", Equipe: "Design" }),
        member({ id: 2, Prenom_Nom: "Louis", Equipe: "Design" }),
        member({ id: 3, Prenom_Nom: "Zoe", Equipe: "Tech" }),
        member({ id: 4, Prenom_Nom: "Anna", Equipe: "Design" }),
      ],
      "Design",
      1,
    );
    assert.deepEqual(
      list.map((m) => m.id),
      [4, 2],
    );
  });

  it("département vide → liste vide", () => {
    assert.deepEqual(
      filterEquipeMembersByDepartement([member({ id: 2 })], "", 1),
      [],
    );
  });
});

describe("filterSuiviForIntervenantMonth / suiviSansBdc", () => {
  it("filtre mois + intervenant", () => {
    const rows = filterSuiviForIntervenantMonth(
      [
        suivi({ id: 10, Intervenants: 2, Periode: SEPT_2026 }),
        suivi({ id: 11, Intervenants: 2, Periode: AOUT_2026 }),
        suivi({ id: 12, Intervenants: 3, Periode: SEPT_2026 }),
      ],
      2,
      "2026-09",
    );
    assert.deepEqual(
      rows.map((r) => r.id),
      [10],
    );
  });

  it("détecte absence de BDC", () => {
    assert.equal(suiviSansBdc(suivi({ id: 1 })), true);
    assert.equal(suiviSansBdc(suivi({ id: 2, BDC_cible: 5 })), false);
  });
});

describe("init / save / fields", () => {
  it("init drafts depuis Realise", () => {
    const drafts = initCraRevueEquipeDrafts([
      suivi({ id: 7, Nb_jours: 3.5, Taches_realisees: "A", BDC_cible: 9 }),
    ]);
    assert.deepEqual(drafts, [
      { realiseId: 7, nbJours: "3.5", taches: "A", bdcId: "9" },
    ]);
  });

  it("save ignore inchangé et accepte BDC + jours", () => {
    const source = suivi({
      id: 7,
      Nb_jours: 2,
      Taches_realisees: "A",
      BDC_cible: 9,
    });
    const unchanged = buildCraRevueEquipeSaveRows(
      [{ realiseId: 7, nbJours: "2", taches: "A", bdcId: "9" }],
      new Map([[7, source]]),
    );
    assert.equal(unchanged.length, 0);

    const changed = buildCraRevueEquipeSaveRows(
      [{ realiseId: 7, nbJours: "4", taches: "B", bdcId: "12" }],
      new Map([[7, source]]),
    );
    assert.deepEqual(changed, [
      { realiseId: 7, nbJours: 4, taches: "B", bdcId: 12 },
    ]);
  });

  it("buildRealiseRevueEquipeFields met 0 si pas de BDC", () => {
    assert.deepEqual(
      buildRealiseRevueEquipeFields({ nbJours: 1, taches: "x", bdcId: null }),
      { Nb_jours: 1, Taches_realisees: "x", BDC_cible: 0 },
    );
  });
});

describe("craRevueEquipeTeamKpis", () => {
  it("agrège freelances / jours / sans BDC / HT", () => {
    const kpis = craRevueEquipeTeamKpis(
      [
        member({ id: 2, TJM: 400 }),
        member({ id: 3, TJM: 500 }),
        member({ id: 4 }),
      ],
      [
        suivi({
          id: 1,
          Intervenants: 2,
          Periode: SEPT_2026,
          Nb_jours: 2,
          BDC_cible: 1,
        }),
        suivi({ id: 2, Intervenants: 2, Periode: SEPT_2026, Nb_jours: 1 }),
        suivi({
          id: 3,
          Intervenants: 3,
          Periode: SEPT_2026,
          Nb_jours: 4,
          BDC_cible: 2,
        }),
      ],
      "2026-09",
    );
    assert.equal(kpis.freelanceCount, 2);
    assert.equal(kpis.joursTotal, 7);
    assert.equal(kpis.sansBdcCount, 1);
    assert.equal(kpis.totalHt, 2 * 400 + 1 * 400 + 4 * 500);
  });
});
