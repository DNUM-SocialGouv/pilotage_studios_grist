import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GristFetchTableResult } from "../gristTypes.ts";
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  buildCraDeclarerSaveRows,
  buildRealiseDeclarerFields,
  craDeclarerDefaultMonthKey,
  craDeclarerMonthOptions,
  craDeclarerPrestationGroups,
  craDeclarerTotalHt,
  findExistingRealiseId,
  initCraDeclarerDrafts,
  parseCraDeclarerJours,
} from "./craDeclarer.ts";
import { findSelfEquipeFromTable } from "./resolveSelfEquipeId.ts";

describe("findSelfEquipeFromTable", () => {
  it("match e-mail insensible à la casse", () => {
    const table = {
      id: [10, 20],
      Prenom_Nom: ["Alice", "Bob"],
      E_mail: ["alice@example.com", "bob@example.com"],
      Equipe: ["Design", "Product"],
    } as GristFetchTableResult;
    const found = findSelfEquipeFromTable(table, "Alice@Example.com");
    assert.deepEqual(found, {
      id: 10,
      prenomNom: "Alice",
      equipeLabel: "Design",
      email: "alice@example.com",
      avatar: undefined,
    });
  });

  it("lit le seed Avatar si présent", () => {
    const table = {
      id: [10],
      Prenom_Nom: ["Alice"],
      E_mail: ["alice@example.com"],
      Equipe: ["Design"],
      Avatar: ["alice-seed"],
    } as GristFetchTableResult;
    const found = findSelfEquipeFromTable(table, "alice@example.com");
    assert.equal(found?.avatar, "alice-seed");
  });

  it("ignore CENSORED et retourne null si pas de match", () => {
    const table = {
      id: [1],
      Prenom_Nom: ["Alice"],
      E_mail: ["CENSORED"],
      Equipe: ["Design"],
    } as GristFetchTableResult;
    assert.equal(findSelfEquipeFromTable(table, "alice@example.com"), null);
  });

  it("lit le TJM si Access Rules le livrent", () => {
    const table = {
      id: [10],
      Prenom_Nom: ["Alice"],
      E_mail: ["alice@example.com"],
      Equipe: ["Design"],
      TJM: [600],
    } as GristFetchTableResult;
    assert.equal(findSelfEquipeFromTable(table, "alice@example.com")?.tjm, 600);
  });

  it("ignore TJM CENSORED", () => {
    const table = {
      id: [10],
      Prenom_Nom: ["Alice"],
      E_mail: ["alice@example.com"],
      Equipe: ["Design"],
      TJM: ["CENSORED"],
    } as GristFetchTableResult;
    assert.equal(
      findSelfEquipeFromTable(table, "alice@example.com")?.tjm,
      undefined,
    );
  });
});

describe("craDeclarer filtre + upsert", () => {
  const missions: Mission[] = [
    { id: 100, Nom_de_la_mission: "Lot A" },
    { id: 200, Nom_de_la_mission: "Lot B" },
  ];
  const enfants: MissionEnfant[] = [
    {
      id: 1,
      Mission: 100,
      Libelle: "Presta moi en cours",
      Intervenant: 5,
      Statut: "En cours",
    },
    {
      id: 2,
      Mission: 100,
      Libelle: "Presta moi terminée",
      Intervenant: 5,
      Statut: "Terminé",
    },
    {
      id: 3,
      Mission: 200,
      Libelle: "Presta autre",
      Intervenant: 9,
      Statut: "En cours",
    },
  ];

  it("ne garde que les prestations en cours du freelance", () => {
    const groups = craDeclarerPrestationGroups(5, enfants, missions);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.missionId, 100);
    assert.deepEqual(
      groups[0]?.prestations.map((p) => p.enfantId),
      [1],
    );
  });

  it("trouve un Realise existant pour le mois", () => {
    const suivi: SuiviMensuel[] = [
      {
        id: 50,
        Intervenants: 5,
        Mission_enfant: 1,
        Periode: Math.floor(Date.UTC(2026, 8, 1) / 1000),
        Nb_jours: 2,
        Taches_realisees: "Avant",
      },
    ];
    assert.equal(findExistingRealiseId(suivi, 5, 1, "2026-09"), 50);
    assert.equal(findExistingRealiseId(suivi, 5, 1, "2026-08"), null);
  });

  it("préremplit les drafts depuis Realise", () => {
    const suivi: SuiviMensuel[] = [
      {
        id: 50,
        Intervenants: 5,
        Mission_enfant: 1,
        Periode: Math.floor(Date.UTC(2026, 8, 1) / 1000),
        Nb_jours: 2.5,
        Taches_realisees: "Pair programming",
      },
    ];
    const groups = craDeclarerPrestationGroups(5, enfants, missions);
    const flat = groups.flatMap((g) => g.prestations);
    const drafts = initCraDeclarerDrafts(flat, suivi, 5, "2026-09");
    assert.equal(drafts.length, 1);
    assert.equal(drafts[0]?.nbJours, "2.5");
    assert.equal(drafts[0]?.taches, "Pair programming");
    assert.equal(drafts[0]?.existingRealiseId, 50);
  });

  it("parse les jours et ignore les lignes vides à la sauvegarde", () => {
    assert.equal(parseCraDeclarerJours("3,5"), 3.5);
    assert.equal(parseCraDeclarerJours(""), null);
    assert.throws(() => parseCraDeclarerJours("-1"), /invalide/);

    const rowsByEnfantId = new Map(
      craDeclarerPrestationGroups(5, enfants, missions)
        .flatMap((g) => g.prestations)
        .map((r) => [r.enfantId, r] as const),
    );
    const save = buildCraDeclarerSaveRows(
      [
        { enfantId: 1, nbJours: "2", taches: "Travail", existingRealiseId: null },
        { enfantId: 99, nbJours: "", taches: "", existingRealiseId: null },
      ],
      rowsByEnfantId,
    );
    assert.equal(save.length, 1);
    assert.equal(save[0]?.nbJours, 2);
  });

  it("construit les champs Realise sans montants", () => {
    const fields = buildRealiseDeclarerFields({
      intervenantId: 5,
      missionId: 100,
      enfantId: 1,
      nbJours: 3,
      taches: "Desc",
      periodeTs: 1_000_000,
      equipeLabel: "Design",
    });
    assert.equal(fields.Intervenants, 5);
    assert.equal(fields.Nb_jours, 3);
    assert.equal(fields.Equipe, "Design");
    assert.equal("Calcul_TTC" in fields, false);
  });
});

describe("craDeclarer mois", () => {
  it("propose une fenêtre de mois autour de maintenant", () => {
    const opts = craDeclarerMonthOptions(new Date(2026, 8, 15));
    assert.ok(opts.length >= 7);
    assert.ok(opts.some((o) => o.value === "2026-09"));
    assert.equal(craDeclarerDefaultMonthKey(new Date(2026, 8, 15)), "2026-09");
  });
});

describe("craDeclarerTotalHt", () => {
  it("multiplie jours × TJM", () => {
    assert.equal(craDeclarerTotalHt(3.5, 600), 2100);
  });

  it("retourne undefined sans TJM lisible", () => {
    assert.equal(craDeclarerTotalHt(3, undefined), undefined);
  });
});
