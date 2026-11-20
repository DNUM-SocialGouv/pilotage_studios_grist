import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PortageProjet } from "../types.ts";
import {
  bdcDisplayLabel,
  maltPortageOptionsForFreelance,
  resolvePortageProjetDisplay,
} from "./portageProjet.ts";

const rows: PortageProjet[] = [
  {
    id: 1,
    Nom_du_projet: "Mission A Malt",
    Porteur: "Malt",
    Freelance: 10,
    Bon_de_commande: 100,
  },
  {
    id: 2,
    Nom_du_projet: "Mission B Malt",
    Porteur: "Malt",
    Freelance: 10,
    Bon_de_commande: 101,
  },
  {
    id: 3,
    Nom_du_projet: "Autre freelance",
    Porteur: "Malt",
    Freelance: 20,
    Bon_de_commande: 100,
  },
  {
    id: 4,
    Nom_du_projet: "Inop's",
    Porteur: "Inop's",
    Freelance: 10,
    Bon_de_commande: 102,
  },
];

describe("maltPortageOptionsForFreelance", () => {
  it("filtre Malt + freelance", () => {
    const opts = maltPortageOptionsForFreelance(rows, 10);
    assert.deepEqual(
      opts.map((o) => o.id),
      [1, 2],
    );
    assert.equal(opts[0]!.bdcId, 100);
  });

  it("liste vide sans freelance", () => {
    assert.deepEqual(maltPortageOptionsForFreelance(rows, null), []);
  });

  it("conserve la sélection orpheline", () => {
    const opts = maltPortageOptionsForFreelance(rows, 10, 4);
    assert.ok(opts.some((o) => o.id === 4));
  });
});

describe("bdcDisplayLabel / resolvePortageProjetDisplay", () => {
  it("préfère Nom_BdC", () => {
    assert.equal(
      bdcDisplayLabel({ id: 100, Nom_BdC: "BDC Design", BdC_Chorus: "123" }, 100),
      "BDC Design",
    );
  });

  it("résout titre + BDC", () => {
    const bdcById = new Map([
      [100, { id: 100, Nom_BdC: "Studio SPC", BdC_Chorus: "1407" }],
    ]);
    const display = resolvePortageProjetDisplay(rows[0], bdcById);
    assert.deepEqual(display, {
      titreMalt: "Mission A Malt",
      bdcLabel: "Studio SPC",
    });
  });
});
