import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Intervenant, Mission, MissionEnfant } from "../types.ts";
import {
  buildCarnetDepartementPrestationRows,
  craCarnetDepartementGroups,
} from "./craCarnetDepartement.ts";

function mission(id: number, nom: string, statut = "En cours"): Mission {
  return { id, Nom_de_la_mission: nom, Statut: statut };
}

function presta(
  id: number,
  missionId: number,
  intervenantId: number,
  titre: string,
  statut = "En cours",
): MissionEnfant {
  return {
    id,
    Mission: missionId,
    Intervenant: intervenantId,
    Libelle: titre,
    Statut: statut,
    Date_de_debut: 1_700_000_000 + id,
  };
}

function intervenant(id: number, equipe: string, nom: string): Intervenant {
  return { id, Equipe: equipe, Prenom_Nom: nom };
}

describe("craCarnetDepartement", () => {
  const missions: Mission[] = [
    mission(1, "Mission Product seule"),
    mission(2, "Mission Access seule"),
    mission(3, "Mission mixte Access+Product"),
  ];

  const enfants: MissionEnfant[] = [
    presta(10, 1, 100, "Presta Product A"),
    presta(20, 2, 200, "Presta Access B"),
    presta(30, 3, 200, "Presta Access C"),
    presta(31, 3, 100, "Presta Product D"),
    presta(32, 3, 300, "Presta Design E"),
  ];

  const intervenants: Intervenant[] = [
    intervenant(100, "Product", "Alice Product"),
    intervenant(200, "Access.", "Bob Access"),
    intervenant(300, "Design", "Carla Design"),
  ];

  it("département vide → aucune ligne", () => {
    assert.deepEqual(
      buildCarnetDepartementPrestationRows("", enfants, missions, intervenants),
      [],
    );
  });

  it("Product : mission Product seule + mixte ; exclut Access seule", () => {
    const rows = buildCarnetDepartementPrestationRows(
      "Product",
      enfants,
      missions,
      intervenants,
    );
    const missionIds = [...new Set(rows.map((r) => r.missionId))].sort(
      (a, b) => a - b,
    );
    assert.deepEqual(missionIds, [1, 3]);
    assert.equal(
      rows.every((r) => r.intervenantId === 100),
      true,
    );
    assert.equal(rows.some((r) => r.enfantId === 20), false);
  });

  it("normalise les espaces du libellé département", () => {
    const rows = buildCarnetDepartementPrestationRows(
      "  Product  ",
      enfants,
      missions,
      intervenants,
    );
    assert.ok(rows.length >= 1);
  });

  it("groupes en cours : une presta Product sur la mixte suffit", () => {
    const groups = craCarnetDepartementGroups(
      "Product",
      enfants,
      missions,
      intervenants,
      "en-cours",
    );
    const byId = new Map(groups.map((g) => [g.missionId, g]));
    assert.ok(byId.has(1));
    assert.ok(byId.has(3));
    assert.equal(byId.has(2), false);
    assert.equal(byId.get(3)!.prestations.length, 1);
    assert.equal(byId.get(3)!.prestations[0]!.enfantId, 31);
  });

  it("ignore les prestations terminées en filtre en-cours", () => {
    const withDone: MissionEnfant[] = [
      ...enfants,
      presta(40, 1, 100, "Presta Product terminée", "Terminé"),
    ];
    const groups = craCarnetDepartementGroups(
      "Product",
      withDone,
      missions,
      intervenants,
      "en-cours",
    );
    const mission1 = groups.find((g) => g.missionId === 1);
    assert.ok(mission1);
    assert.equal(
      mission1.prestations.every((p) => p.enfantId !== 40),
      true,
    );
  });
});
