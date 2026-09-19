import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EquipeMember } from "../types.ts";
import {
  EQUIPE_DEFAULT_STATUT,
  equipeDisplayName,
  equipeFieldReadable,
  equipeMontantLisible,
  filterEquipeMembers,
  initialEquipeStatutFilter,
  uniqueSortedLabels,
} from "./equipeList.ts";

const alice: EquipeMember = {
  id: 1,
  Prenom_Nom: "Alice Martin",
  Equipe: "Design",
  Portage: "MALT",
  Statut: "Actif",
  Specialite: "UX",
  Role_ACL: "Freelance",
};
const bob: EquipeMember = {
  id: 2,
  Prenom_Nom: "Bob Durand",
  Equipe: "Tech",
  Portage: "OCTO",
  Statut: "Inactif",
  Specialite: "Dev",
  Role_ACL: "Admin",
};
const sansNom: EquipeMember = {
  id: 3,
  Equipe: "Design",
  Statut: "Actif",
};

describe("equipeDisplayName", () => {
  it("utilise le nom ou un fallback d’id", () => {
    assert.equal(equipeDisplayName(alice), "Alice Martin");
    assert.equal(equipeDisplayName(sansNom), "Personne #3");
  });
});

describe("equipeMontantLisible", () => {
  it("accepte un nombre fini et refuse le reste", () => {
    assert.equal(equipeMontantLisible(450), true);
    assert.equal(equipeMontantLisible(0), true);
    assert.equal(equipeMontantLisible(undefined), false);
    assert.equal(equipeMontantLisible(Number.NaN), false);
  });
});

describe("uniqueSortedLabels", () => {
  it("déduplique et trie", () => {
    assert.deepEqual(uniqueSortedLabels(["Tech", "Design", "  ", undefined, "Design"]), [
      "Design",
      "Tech",
    ]);
  });
});

describe("initialEquipeStatutFilter / equipeFieldReadable", () => {
  it("propose Actif quand la colonne Statut est lisible", () => {
    assert.equal(initialEquipeStatutFilter([alice, bob]), EQUIPE_DEFAULT_STATUT);
    assert.equal(equipeFieldReadable([alice, bob], "Statut"), true);
  });

  it("laisse le filtre vide si Statut censuré (Freelance)", () => {
    const restricted: EquipeMember[] = [
      { id: 1, Prenom_Nom: "Alice", Equipe: "Design", Specialite: "UX" },
      { id: 2, Prenom_Nom: "Bob", Equipe: "Tech", Specialite: "Dev" },
    ];
    assert.equal(initialEquipeStatutFilter(restricted), "");
    assert.equal(equipeFieldReadable(restricted, "Statut"), false);
    assert.equal(equipeFieldReadable(restricted, "Portage"), false);
    assert.equal(equipeFieldReadable(restricted, "Equipe"), true);
    const rows = filterEquipeMembers(restricted, {
      search: "",
      statut: "",
      equipe: "",
      portage: "",
      role: "",
    });
    assert.equal(rows.length, 2);
  });

  it("ignore la string CENSORED comme valeur lisible", () => {
    const censored: EquipeMember[] = [
      {
        id: 1,
        Prenom_Nom: "Alice",
        Equipe: "Design",
        Portage: "CENSORED",
        Statut: "CENSORED",
        Role_ACL: "...",
        Specialite: "UX",
      },
    ];
    assert.equal(equipeFieldReadable(censored, "Portage"), false);
    assert.equal(equipeFieldReadable(censored, "Statut"), false);
    assert.equal(equipeFieldReadable(censored, "Role_ACL"), false);
    assert.equal(equipeFieldReadable(censored, "Specialite"), true);
    assert.equal(initialEquipeStatutFilter(censored), "");
  });
});

describe("filterEquipeMembers", () => {
  const all = [bob, alice, sansNom];

  it("filtre par statut Actif par défaut métier", () => {
    const rows = filterEquipeMembers(all, {
      search: "",
      statut: EQUIPE_DEFAULT_STATUT,
      equipe: "",
      portage: "",
      role: "",
    });
    assert.deepEqual(
      rows.map((r) => r.id),
      [1, 3],
    );
  });

  it("cherche dans le nom et trie", () => {
    const rows = filterEquipeMembers(all, {
      search: "durand",
      statut: "",
      equipe: "",
      portage: "",
      role: "",
    });
    assert.deepEqual(
      rows.map((r) => r.id),
      [2],
    );
  });

  it("combine département et rôle", () => {
    const rows = filterEquipeMembers(all, {
      search: "",
      statut: "",
      equipe: "Design",
      portage: "",
      role: "Freelance",
    });
    assert.deepEqual(
      rows.map((r) => r.id),
      [1],
    );
  });
});
