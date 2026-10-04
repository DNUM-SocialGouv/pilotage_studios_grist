import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EquipeMember, Mission, ProduitSdpc } from "../types.ts";
import {
  buildWelcomeSearchGroups,
  flattenWelcomeSearchHits,
  hasWelcomeSearchTargets,
  shouldShowWelcomeSearch,
  WELCOME_SEARCH_MIN_CHARS,
  welcomeSearchOptionId,
  welcomeSearchStatusMessage,
} from "./welcomeSearch.ts";

function produit(partial: Partial<ProduitSdpc> & { id: number }): ProduitSdpc {
  return {
    Produit: partial.Produit ?? `Produit ${partial.id}`,
    Statut_actuel: partial.Statut_actuel ?? "En cours",
    departement_sdpc: partial.departement_sdpc ?? "Studio A",
    ...partial,
  };
}

function mission(partial: Partial<Mission> & { id: number }): Mission {
  return {
    Nom_de_la_mission: partial.Nom_de_la_mission ?? `Mission ${partial.id}`,
    Statut: partial.Statut ?? "En cours",
    Produit_SDPC: partial.Produit_SDPC,
    ...partial,
  };
}

function member(partial: Partial<EquipeMember> & { id: number }): EquipeMember {
  return {
    Prenom_Nom: partial.Prenom_Nom ?? `Personne ${partial.id}`,
    Equipe: partial.Equipe ?? "Studio A",
    Specialite: partial.Specialite ?? "Design",
    ...partial,
  };
}

const ALL_TARGETS = { produits: true, missions: true, equipe: true };

describe("shouldShowWelcomeSearch / hasWelcomeSearchTargets", () => {
  it("montre la barre pour Admin / Resp. / Freelance seulement", () => {
    assert.equal(shouldShowWelcomeSearch("admin"), true);
    assert.equal(shouldShowWelcomeSearch("responsable"), true);
    assert.equal(shouldShowWelcomeSearch("freelance"), true);
    assert.equal(shouldShowWelcomeSearch("invite"), false);
    assert.equal(shouldShowWelcomeSearch("unknown"), false);
  });

  it("détecte au moins une cible Page_*", () => {
    assert.equal(hasWelcomeSearchTargets(ALL_TARGETS), true);
    assert.equal(
      hasWelcomeSearchTargets({ produits: false, missions: false, equipe: false }),
      false,
    );
    assert.equal(
      hasWelcomeSearchTargets({ produits: false, missions: true, equipe: false }),
      true,
    );
  });
});

describe("buildWelcomeSearchGroups", () => {
  const produits = [
    produit({ id: 1, Produit: "Pass Culture" }),
    produit({ id: 2, Produit: "Mon Espace Santé" }),
  ];
  const missions = [
    mission({
      id: 10,
      Nom_de_la_mission: "Refonte Pass",
      Produit_SDPC: 1,
    }),
    mission({
      id: 11,
      Nom_de_la_mission: "Audit accessibilité",
      Produit_SDPC: 2,
    }),
  ];
  const members = [
    member({ id: 100, Prenom_Nom: "Camille Martin" }),
    member({ id: 101, Prenom_Nom: "Samir Benali", Specialite: "Dev" }),
  ];

  it("ignore les requêtes trop courtes", () => {
    const groups = buildWelcomeSearchGroups({
      query: "p",
      targets: ALL_TARGETS,
      produits,
      missions,
      members,
    });
    assert.equal(groups.totalMatched, 0);
    assert.ok(WELCOME_SEARCH_MIN_CHARS >= 2);
  });

  it("groupe Produits · Missions · Personnes et plafonne", () => {
    const manyProduits = Array.from({ length: 10 }, (_, i) =>
      produit({ id: i + 1, Produit: `Alpha produit ${i + 1}` }),
    );
    const groups = buildWelcomeSearchGroups({
      query: "alpha",
      targets: ALL_TARGETS,
      produits: manyProduits,
      missions: [],
      members: [],
      maxPerGroup: 6,
    });
    assert.equal(groups.produits.length, 6);
    assert.equal(groups.truncated.produits, true);
    assert.equal(groups.totalMatched, 10);
    assert.equal(groups.totalShown, 6);
  });

  it("respecte les cibles Page_* (pas de Personne si équipe fermée)", () => {
    const groups = buildWelcomeSearchGroups({
      query: "camille",
      targets: { produits: true, missions: true, equipe: false },
      produits,
      missions,
      members,
    });
    assert.equal(groups.personnes.length, 0);
    assert.equal(groups.totalMatched, 0);
  });

  it("trouve produit, mission et personne", () => {
    const groups = buildWelcomeSearchGroups({
      query: "pass",
      targets: ALL_TARGETS,
      produits,
      missions,
      members,
    });
    assert.equal(groups.produits.length, 1);
    assert.equal(groups.produits[0]?.href, "/produits/1");
    assert.equal(groups.missions.length, 1);
    assert.equal(groups.missions[0]?.href, "/missions/10");
    assert.equal(groups.missions[0]?.statut, "En cours");
    assert.equal(groups.missions[0]?.meta, "Pass Culture");
    assert.equal(groups.personnes.length, 0);

    const personnes = buildWelcomeSearchGroups({
      query: "camille",
      targets: ALL_TARGETS,
      produits,
      missions,
      members,
    });
    assert.equal(personnes.personnes.length, 1);
    assert.equal(personnes.personnes[0]?.href, "/equipe/100");
  });

  it("aplatit dans l’ordre Produits → Missions → Personnes", () => {
    const groups = buildWelcomeSearchGroups({
      query: "a",
      targets: ALL_TARGETS,
      produits: [produit({ id: 1, Produit: "Alpha" })],
      missions: [mission({ id: 2, Nom_de_la_mission: "Alpha mission" })],
      members: [member({ id: 3, Prenom_Nom: "Alpha Personne" })],
    });
    // query "a" trop court
    assert.equal(flattenWelcomeSearchHits(groups).length, 0);

    const groups2 = buildWelcomeSearchGroups({
      query: "alpha",
      targets: ALL_TARGETS,
      produits: [produit({ id: 1, Produit: "Alpha" })],
      missions: [mission({ id: 2, Nom_de_la_mission: "Alpha mission" })],
      members: [member({ id: 3, Prenom_Nom: "Alpha Personne" })],
    });
    const flat = flattenWelcomeSearchHits(groups2);
    assert.deepEqual(
      flat.map((h) => h.kind),
      ["produit", "mission", "personne"],
    );
    assert.equal(welcomeSearchOptionId(flat[0]!), "welcome-search-produit-1");
  });
});

describe("welcomeSearchStatusMessage", () => {
  const emptyGroups = buildWelcomeSearchGroups({
    query: "",
    targets: ALL_TARGETS,
    produits: [],
    missions: [],
    members: [],
  });

  it("guide sous le seuil et annonce les résultats", () => {
    assert.match(
      welcomeSearchStatusMessage({
        query: "x",
        loading: false,
        error: null,
        groups: emptyGroups,
      }),
      /2 lettres/,
    );
    assert.match(
      welcomeSearchStatusMessage({
        query: "ab",
        loading: true,
        error: null,
        groups: emptyGroups,
      }),
      /Chargement/,
    );
    const withHits = {
      ...emptyGroups,
      totalMatched: 3,
      totalShown: 3,
    };
    assert.equal(
      welcomeSearchStatusMessage({
        query: "ab",
        loading: false,
        error: null,
        groups: withHits,
      }),
      "3 résultats",
    );
  });
});
