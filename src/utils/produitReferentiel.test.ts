import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProduitSdpc } from "../types.ts";
import {
  PRODUIT_REFERENTIEL_FIELDS,
  computeReferentielCompletion,
  formatReferentielField,
  formatReferentielPercent,
  produitNomComplet,
  themeFilledCount,
} from "./produitReferentiel.ts";

const vao: ProduitSdpc = {
  id: 412,
  Produit: "VAO",
  Description: "Vacances Adaptées Organisées",
  Statut_actuel: "En build",
  departement_sdpc: "GPS",
  D_Metier: "DGCS",
  Equipe: "A, B",
  Chef_de_produit: "RACHEDI Assia",
  URLs_du_produit: "https://vao.social.gouv.fr/",
  Liens_repos_depots: "https://github.com/DNUM-SocialGouv/vao https://github.com/SocialGouv/vao-shared",
  Fonctionnalites_et_contexte: "Pour les organisateurs",
  Actions_de_la_feuille_de_route: "Porter VAO à maturité",
  Statut_d_homologation_de_securite: "Homologuée",
  Debut_validite_homologation: Math.floor(Date.UTC(2026, 5, 1) / 1000),
  Fin_de_validite_d_homologation: Math.floor(Date.UTC(2027, 5, 1) / 1000),
  Besoin_DICT_Disponibilite: "2",
  Besoin_DICT_Integrite: "3",
  Besoin_DICT_Confidentialite: "2",
  Besoin_DICT_Tracabilite: "2",
  SCORE_RGAA_Declaration_reglementaire: "Oui",
  RGAA_Date_declaration: Math.floor(Date.UTC(2025, 6, 25) / 1000),
  RGAA_Tx_conformite: 0.65,
  Cibles_du_produit: "Agents, Associations",
  Volumetrie_utilisateurs_par_an: "De 1 000 à 10 000",
  Nature_de_l_application: "Dév. Spécifique",
  Criticite: "2 : Service essentiel",
  Typologie_d_application: "Formulaires",
  Bouton_JDMA: false,
  Hebergement: "Fabrique",
  URL_Back_Office: "https://admin-vao.social.gouv.fr/",
  Marche_DEV_TMA: "N/A",
  Prestataire_de_developpement: "Interne",
};

describe("PRODUIT_REFERENTIEL_FIELDS", () => {
  it("compte 37 champs sync", () => {
    assert.equal(PRODUIT_REFERENTIEL_FIELDS.length, 37);
  });
});

describe("formatReferentielPercent", () => {
  it("convertit un ratio 0–1", () => {
    assert.equal(formatReferentielPercent(0.65), "65 %");
  });
  it("conserve un pourcentage déjà en base 100", () => {
    assert.equal(formatReferentielPercent(84), "84 %");
  });
});

describe("formatReferentielField", () => {
  it("formate URL et liens dépôts", () => {
    const urlField = PRODUIT_REFERENTIEL_FIELDS.find((f) => f.key === "URLs_du_produit")!;
    const urlsField = PRODUIT_REFERENTIEL_FIELDS.find((f) => f.key === "Liens_repos_depots")!;
    const url = formatReferentielField(vao, urlField);
    assert.equal(url.kind, "link");
    if (url.kind === "link") {
      assert.equal(url.href, "https://vao.social.gouv.fr/");
    }
    const repos = formatReferentielField(vao, urlsField);
    assert.equal(repos.kind, "links");
    if (repos.kind === "links") {
      assert.equal(repos.links.length, 2);
    }
  });

  it("formate bool JDMA false comme renseigné", () => {
    const field = PRODUIT_REFERENTIEL_FIELDS.find((f) => f.key === "Bouton_JDMA")!;
    const v = formatReferentielField(vao, field);
    assert.deepEqual(v, { kind: "bool", value: false });
  });

  it("formate le taux RGAA", () => {
    const field = PRODUIT_REFERENTIEL_FIELDS.find((f) => f.key === "RGAA_Tx_conformite")!;
    const v = formatReferentielField(vao, field);
    assert.deepEqual(v, { kind: "text", text: "65 %" });
  });
});

describe("computeReferentielCompletion", () => {
  it("calcule filled / empty / percent", () => {
    const c = computeReferentielCompletion(vao);
    assert.equal(c.total, 37);
    assert.ok(c.filled >= 28);
    assert.equal(c.filled + c.empty, 37);
    assert.equal(c.percent, Math.round((c.filled / 37) * 100));
  });

  it("compte les champs vides sur un produit minimal", () => {
    const c = computeReferentielCompletion({ id: 1, Produit: "X" });
    assert.equal(c.filled, 1);
    assert.equal(c.empty, 36);
  });
});

describe("themeFilledCount / produitNomComplet", () => {
  it("compte l’identité", () => {
    const id = themeFilledCount(vao, "identite");
    assert.equal(id.total, 11);
    assert.equal(id.filled, 11);
  });

  it("extrait le nom complet", () => {
    assert.equal(produitNomComplet(vao), "Vacances Adaptées Organisées");
    assert.equal(produitNomComplet({ id: 1, Produit: "X", Description: "X" }), "");
  });
});
