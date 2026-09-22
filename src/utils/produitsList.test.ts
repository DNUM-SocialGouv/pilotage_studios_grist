import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, ProduitSdpc } from "../types.ts";
import {
  PRODUITS_DEFAULT_EN_PROD,
  filterProduits,
  initialProduitsEnProdFilter,
  missionsLieesAuProduit,
  produitDepartement,
  produitDisplayName,
  produitEnProdLabel,
  produitDescription,
  safeHttpUrl,
} from "./produitsList.ts";

const basavi: ProduitSdpc = {
  id: 26,
  Produit: "BASAVI",
  departement_sdpc: "GPS",
  Statut_actuel: "En amélioration continue",
  En_prod: true,
  Chef_de_produit: "Alice Martin",
  Equipe: "Alice, Bob",
  Type_de_produit: "Site",
  Description: "Court",
  Description_longue: "Long",
  URLs_du_produit: "https://example.gouv.fr/",
};

const archive: ProduitSdpc = {
  id: 1,
  Produit: "ARCHIVÉ",
  departement_sdpc: "SPC",
  Statut_actuel: "Décom demandée",
  En_prod: false,
  Chef_de_produit: "Bob",
};

const sansEnProd: ProduitSdpc = {
  id: 99,
  Produit: "Sans flag",
  departement_sdpc: "GPS",
};

describe("produitDisplayName / produitDepartement", () => {
  it("lit Produit et département", () => {
    assert.equal(produitDisplayName(basavi), "BASAVI");
    assert.equal(produitDepartement(basavi), "GPS");
    assert.equal(produitDisplayName({ id: 7 }), "Produit #7");
  });
});

describe("produitDescription / produitEnProdLabel", () => {
  it("préfère Description courte", () => {
    assert.equal(produitDescription(basavi), "Court");
    assert.equal(produitDescription({ id: 1, Description_longue: "Long seul" }), "Long seul");
    assert.equal(produitDescription({ id: 2 }), "");
  });

  it("libellé En production", () => {
    assert.equal(produitEnProdLabel(true), "Oui");
    assert.equal(produitEnProdLabel(false), "Non");
    assert.equal(produitEnProdLabel(undefined), "—");
  });
});

describe("initialProduitsEnProdFilter", () => {
  it("défaut Oui s’il existe au moins un produit en prod", () => {
    assert.equal(initialProduitsEnProdFilter([basavi, archive]), PRODUITS_DEFAULT_EN_PROD);
  });

  it("laisse vide si aucun En_prod true", () => {
    assert.equal(initialProduitsEnProdFilter([archive, sansEnProd]), "");
  });
});

describe("filterProduits", () => {
  it("filtre en production, département, statut et recherche", () => {
    const rows = filterProduits([basavi, archive, sansEnProd], {
      search: "",
      departement: "",
      statut: "",
      enProd: "oui",
    });
    assert.deepEqual(
      rows.map((p) => p.id),
      [26],
    );

    const gps = filterProduits([basavi, archive], {
      search: "basavi",
      departement: "GPS",
      statut: "En amélioration continue",
      enProd: "",
    });
    assert.equal(gps.length, 1);
    assert.equal(gps[0]!.id, 26);

    const none = filterProduits([basavi], {
      search: "zzz",
      departement: "",
      statut: "",
      enProd: "",
    });
    assert.equal(none.length, 0);
  });

  it("trie par libellé", () => {
    const rows = filterProduits([archive, basavi], {
      search: "",
      departement: "",
      statut: "",
      enProd: "",
    });
    assert.deepEqual(
      rows.map((p) => p.Produit),
      ["ARCHIVÉ", "BASAVI"],
    );
  });
});

describe("missionsLieesAuProduit", () => {
  it("filtre sur Produit_SDPC et trie", () => {
    const missions: Mission[] = [
      { id: 2, Nom_de_la_mission: "Zulu", Produit_SDPC: 26 },
      { id: 1, Nom_de_la_mission: "Alpha", Produit_SDPC: 26 },
      { id: 3, Nom_de_la_mission: "Autre", Produit_SDPC: 1 },
    ];
    const linked = missionsLieesAuProduit(missions, 26);
    assert.deepEqual(
      linked.map((m) => m.Nom_de_la_mission),
      ["Alpha", "Zulu"],
    );
  });
});

describe("safeHttpUrl", () => {
  it("accepte http(s) et refuse le reste", () => {
    assert.equal(safeHttpUrl("https://example.gouv.fr/"), "https://example.gouv.fr/");
    assert.equal(safeHttpUrl("http://localhost:5175"), "http://localhost:5175/");
    assert.equal(safeHttpUrl("javascript:alert(1)"), undefined);
    assert.equal(safeHttpUrl("not a url"), undefined);
    assert.equal(safeHttpUrl(""), undefined);
  });

  it("extrait la première URL http(s) d’un texte multi-valeurs", () => {
    assert.equal(
      safeHttpUrl("Voir https://a.gouv.fr/ et aussi https://b.gouv.fr/"),
      "https://a.gouv.fr/",
    );
    assert.equal(
      safeHttpUrl("https://example.gouv.fr/\nhttps://autre.gouv.fr/"),
      "https://example.gouv.fr/",
    );
    assert.equal(safeHttpUrl("lien: https://example.gouv.fr/."), "https://example.gouv.fr/");
  });
});
