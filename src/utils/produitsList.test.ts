import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types.ts";
import {
  filterProduits,
  missionsLieesAuProduit,
  produitDepartement,
  produitDisplayName,
  produitEnProdLabel,
  produitDescription,
  produitIdsAvecInvestissement,
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

describe("produitIdsAvecInvestissement", () => {
  const missions: Mission[] = [
    { id: 10, Produit_SDPC: 26 },
    { id: 20, Produit_SDPC: 1 },
  ];
  const enfants: MissionEnfant[] = [
    { id: 100, Mission: 10 },
    { id: 200, Mission: 20 },
  ];

  it("détecte jours CRA > 0", () => {
    const suivi: SuiviMensuel[] = [{ id: 1, Mission_enfant: 100, Nb_jours: 2, TTC: 0 }];
    const ids = produitIdsAvecInvestissement(missions, enfants, suivi);
    assert.ok(ids.has(26));
    assert.equal(ids.has(1), false);
  });

  it("détecte TTC CRA > 0 même sans jours", () => {
    const suivi: SuiviMensuel[] = [{ id: 1, Mission_enfant: 200, Nb_jours: 0, TTC: 150 }];
    const ids = produitIdsAvecInvestissement(missions, enfants, suivi);
    assert.ok(ids.has(1));
    assert.equal(ids.has(26), false);
  });

  it("ignore les CRA sans mission / produit", () => {
    const suivi: SuiviMensuel[] = [{ id: 1, Mission_enfant: 999, Nb_jours: 5, TTC: 100 }];
    const ids = produitIdsAvecInvestissement(missions, enfants, suivi);
    assert.equal(ids.size, 0);
  });

  it("accepte le rattachement legacy Missions", () => {
    const suivi: SuiviMensuel[] = [{ id: 1, Missions: 10, Nb_jours: 1 }];
    const ids = produitIdsAvecInvestissement(missions, enfants, suivi);
    assert.ok(ids.has(26));
  });
});

describe("filterProduits", () => {
  it("filtre investissement, département, statut et recherche", () => {
    const investis = new Set([26]);
    const rows = filterProduits(
      [basavi, archive, sansEnProd],
      {
        search: "",
        departement: "",
        statut: "",
        avecInvestissementStudio: true,
      },
      investis,
    );
    assert.deepEqual(
      rows.map((p) => p.id),
      [26],
    );

    const gps = filterProduits(
      [basavi, archive],
      {
        search: "basavi",
        departement: "GPS",
        statut: "En amélioration continue",
        avecInvestissementStudio: false,
      },
      investis,
    );
    assert.equal(gps.length, 1);
    assert.equal(gps[0]!.id, 26);

    const none = filterProduits(
      [basavi],
      {
        search: "zzz",
        departement: "",
        statut: "",
        avecInvestissementStudio: false,
      },
      investis,
    );
    assert.equal(none.length, 0);
  });

  it("sans filtre investissement : tout le catalogue (hors autres filtres)", () => {
    const rows = filterProduits(
      [basavi, archive],
      {
        search: "",
        departement: "",
        statut: "",
        avecInvestissementStudio: false,
      },
      new Set(),
    );
    assert.deepEqual(
      rows.map((p) => p.Produit),
      ["ARCHIVÉ", "BASAVI"],
    );
  });

  it("trie par libellé", () => {
    const rows = filterProduits(
      [archive, basavi],
      {
        search: "",
        departement: "",
        statut: "",
        avecInvestissementStudio: false,
      },
    );
    assert.deepEqual(
      rows.map((p) => p.Produit),
      ["ARCHIVÉ", "BASAVI"],
    );
  });
});

describe("missionsLieesAuProduit", () => {
  it("filtre sur Produit_SDPC et trie alpha si mêmes statuts", () => {
    const missions: Mission[] = [
      { id: 2, Nom_de_la_mission: "Zulu", Produit_SDPC: 26, Statut: "En cours" },
      { id: 1, Nom_de_la_mission: "Alpha", Produit_SDPC: 26, Statut: "En cours" },
      { id: 3, Nom_de_la_mission: "Autre", Produit_SDPC: 1, Statut: "En cours" },
    ];
    const linked = missionsLieesAuProduit(missions, 26);
    assert.deepEqual(
      linked.map((m) => m.Nom_de_la_mission),
      ["Alpha", "Zulu"],
    );
  });

  it("place les missions en cours avant les terminées (Accolade)", () => {
    const missions: Mission[] = [
      {
        id: 1,
        Nom_de_la_mission: "Audit accessibilité et accompagnement devs",
        Produit_SDPC: 26,
        Statut: "TERMINÉ",
      },
      {
        id: 2,
        Nom_de_la_mission: "Réalisation du produit Accolade",
        Produit_SDPC: 26,
        Statut: "EN COURS",
      },
      {
        id: 3,
        Nom_de_la_mission: "Renfort de l’équipe de développement",
        Produit_SDPC: 26,
        Statut: "TERMINÉ",
      },
    ];
    const linked = missionsLieesAuProduit(missions, 26);
    assert.deepEqual(
      linked.map((m) => m.Nom_de_la_mission),
      [
        "Réalisation du produit Accolade",
        "Audit accessibilité et accompagnement devs",
        "Renfort de l’équipe de développement",
      ],
    );
  });

  it("ne traite pas un statut vide comme en cours", () => {
    const missions: Mission[] = [
      {
        id: 1,
        Nom_de_la_mission: "Sans statut",
        Produit_SDPC: 26,
        Statut: "",
      },
      {
        id: 2,
        Nom_de_la_mission: "Active",
        Produit_SDPC: 26,
        Statut: "EN COURS",
      },
      {
        id: 3,
        Nom_de_la_mission: "Finie",
        Produit_SDPC: 26,
        Statut: "TERMINÉ",
      },
    ];
    const linked = missionsLieesAuProduit(missions, 26);
    assert.deepEqual(
      linked.map((m) => m.Nom_de_la_mission),
      ["Active", "Finie", "Sans statut"],
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
