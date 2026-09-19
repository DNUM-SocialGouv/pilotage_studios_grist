import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant } from "../types.ts";
import {
  buildEquipePrestationRows,
  filterEquipePrestationRows,
  groupEquipePrestationRowsByMission,
  isPrestationEnCours,
} from "./equipeMemberPrestations.ts";

describe("isPrestationEnCours", () => {
  it("traite vide / inconnu comme en cours", () => {
    assert.equal(isPrestationEnCours(undefined), true);
    assert.equal(isPrestationEnCours(""), true);
    assert.equal(isPrestationEnCours("En cours"), true);
    assert.equal(isPrestationEnCours("En pause"), true);
  });

  it("exclut les statuts terminés (accents / casse)", () => {
    assert.equal(isPrestationEnCours("Terminé"), false);
    assert.equal(isPrestationEnCours("termine"), false);
    assert.equal(isPrestationEnCours("Clos"), false);
    assert.equal(isPrestationEnCours("Archivé"), false);
  });

  it("exclut les prestations annulées du filtre en cours", () => {
    assert.equal(isPrestationEnCours("Annulé"), false);
    assert.equal(isPrestationEnCours("Annulée"), false);
    assert.equal(isPrestationEnCours("annule"), false);
  });
});

describe("buildEquipePrestationRows", () => {
  const missions: Mission[] = [
    { id: 10, Nom_de_la_mission: "Portail national" },
    { id: 20, Nom_de_la_mission: "Appui DSFR" },
  ];

  const enfants: MissionEnfant[] = [
    {
      id: 1,
      Mission: 10,
      Intervenant: 5,
      Libelle: "Design sprint 3",
      Type_prestation: "Freelance_jours",
      Statut: "En cours",
      Date_de_debut: 1_700_000_000,
    },
    {
      id: 2,
      Mission: 10,
      Intervenant: 5,
      Libelle: "Atelier a11y",
      Type_prestation: "Freelance_jours",
      Statut: "Terminé",
      Date_de_debut: 1_600_000_000,
    },
    {
      id: 3,
      Mission: 20,
      Intervenant: 99,
      Libelle: "Autre personne",
      Statut: "En cours",
    },
    {
      id: 4,
      Mission: 20,
      Intervenant: 5,
      Libelle: "Audit RGAA",
      Type_prestation: "Entreprise_forfait",
      Statut: "En pause",
      Date_de_debut: 1_650_000_000,
    },
  ];

  it("ne garde que les prestations de la personne", () => {
    const rows = buildEquipePrestationRows(5, enfants, missions);
    assert.equal(rows.length, 3);
    assert.deepEqual(
      rows.map((r) => r.enfantId),
      [1, 4, 2],
    );
  });

  it("enrichit mission / enCours", () => {
    const rows = buildEquipePrestationRows(5, enfants, missions);
    const first = rows[0]!;
    assert.equal(first.missionLibelle, "Portail national");
    assert.equal(first.prestationLibelle, "Design sprint 3");
    assert.equal(first.enCours, true);
    const termine = rows.find((r) => r.enfantId === 2)!;
    assert.equal(termine.enCours, false);
  });

  it("filtre en-cours vs toutes", () => {
    const rows = buildEquipePrestationRows(5, enfants, missions);
    assert.equal(filterEquipePrestationRows(rows, "toutes").length, 3);
    assert.equal(filterEquipePrestationRows(rows, "en-cours").length, 2);
  });

  it("ignore memberId invalide", () => {
    assert.deepEqual(buildEquipePrestationRows(NaN, enfants, missions), []);
    assert.deepEqual(buildEquipePrestationRows(0, enfants, missions), []);
  });

  it("regroupe les prestations sous une même mission", () => {
    const rows = buildEquipePrestationRows(5, enfants, missions);
    const groups = groupEquipePrestationRowsByMission(rows);
    assert.equal(groups.length, 2);
    const portail = groups.find((g) => g.missionId === 10)!;
    assert.equal(portail.prestations.length, 2);
    assert.deepEqual(
      portail.prestations.map((p) => p.enfantId),
      [1, 2],
    );
    const dsfr = groups.find((g) => g.missionId === 20)!;
    assert.equal(dsfr.prestations.length, 1);
    assert.equal(dsfr.prestations[0]!.enfantId, 4);
  });
});
