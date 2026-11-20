import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  portageImportTemplateCsv,
  previewPortageImport,
  type PortageImportCatalog,
} from "./portageProjetImport.ts";

const catalog: PortageImportCatalog = {
  existingNames: ["Projet déjà là"],
  people: [
    { id: 10, name: "GIZARD Axelle" },
    { id: 11, name: "MARTIN Léa" },
    { id: 12, name: "MARTIN Léa" },
  ],
  peopleReady: true,
  bdcs: [{ id: 4, nom: "2025-2509D42 - Accompagnement", chorus: "1407024492" }],
  bdcReady: true,
};

function csv(body: string): string {
  return `${portageImportTemplateCsv()}${body}`;
}

describe("previewPortageImport", () => {
  it("prépare une ligne complète et reconnaît la personne et le bon de commande", () => {
    const preview = previewPortageImport(
      csv("Nouveau;En cours;Malt;DNUM;Access.;Gizard Axelle;;1407024492;01/03/2026;2026-06-01\n"),
      catalog,
    );
    assert.equal(preview.fileError, undefined);
    assert.equal(preview.readyCount, 1);
    assert.equal(preview.lines[0]?.values?.Freelance, "10");
    assert.equal(preview.lines[0]?.values?.Responsable_du_projet, "");
    assert.equal(preview.lines[0]?.values?.Bon_de_commande, "4");
    assert.equal(preview.lines[0]?.values?.Date_de_debut, "2026-03-01");
    assert.equal(preview.lines[0]?.values?.Date_de_fin, "2026-06-01");
  });

  it("bloque un nom déjà présent, un doublon, une personne inconnue et une date inversée", () => {
    const preview = previewPortageImport(
      csv(
        [
          "Projet déjà là;En cours;Malt;;;;;",
          "Doublon;En cours;Malt;; ;Inconnu;; ;01/06/2026;01/05/2026",
          "Doublon;En cours;Malt;;;;;",
          ";En cours;Malt;;;;;",
        ].join("\n"),
      ),
      catalog,
    );
    assert.equal(preview.readyCount, 0);
    assert.match(preview.lines[0]?.messages.join(" ") ?? "", /déjà ce nom/);
    assert.match(preview.lines[1]?.messages.join(" ") ?? "", /double/);
    assert.match(preview.lines[1]?.messages.join(" ") ?? "", /Personne introuvable/);
    assert.match(preview.lines[1]?.messages.join(" ") ?? "", /date de fin/);
    assert.match(preview.lines[2]?.messages.join(" ") ?? "", /double/);
    assert.match(preview.lines[3]?.messages.join(" ") ?? "", /obligatoire/);
  });

  it("bloque un responsable ambigu et un fichier sans colonne nom", () => {
    const ambiguous = previewPortageImport(csv("Autre;En cours;Malt;;; ;MARTIN Léa;;\n"), catalog);
    assert.match(ambiguous.lines[0]?.messages.join(" ") ?? "", /Plusieurs fiches/);
    const broken = previewPortageImport("Statut;Porteur\nEn cours;Malt\n", catalog);
    assert.match(broken.fileError ?? "", /Nom du projet/);
  });

  it("garde le numéro de ligne du fichier, reconnaît « Chorus … » et refuse un tableau vide", () => {
    const shifted = previewPortageImport(
      csv("\nNouveau;En cours;Malt;;;;;Chorus 1407024492;\n"),
      catalog,
    );
    assert.equal(shifted.readyCount, 1);
    assert.equal(shifted.lines[0]?.line, 3);
    assert.equal(shifted.lines[0]?.values?.Bon_de_commande, "4");

    const empty = previewPortageImport(portageImportTemplateCsv(), catalog);
    assert.match(empty.fileError ?? "", /aucune ligne/);
  });

  it("refuse d’importer une personne si l’annuaire n’est pas lu", () => {
    const preview = previewPortageImport(csv("Nouveau;En cours;Malt;;;GIZARD Axelle;;;\n"), {
      ...catalog,
      peopleReady: false,
    });
    assert.equal(preview.readyCount, 0);
    assert.match(preview.lines[0]?.messages.join(" ") ?? "", /annuaire/);
  });
});
