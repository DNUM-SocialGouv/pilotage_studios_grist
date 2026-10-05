import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyMissionProseHref,
  isSafeInternalPath,
  parseMissionProse,
  parseMissionProseInlines,
} from "./missionProseFormat.ts";

describe("classifyMissionProseHref / isSafeInternalPath", () => {
  it("accepte http(s) et paths app", () => {
    assert.equal(classifyMissionProseHref("https://example.com/x"), "external");
    assert.equal(classifyMissionProseHref("http://localhost:5175/"), "external");
    assert.equal(classifyMissionProseHref("/outils/regles-metier"), "internal");
    assert.equal(classifyMissionProseHref("/"), "internal");
    assert.equal(classifyMissionProseHref("/missions/12#contexte"), "internal");
  });

  it("refuse schémas dangereux et URLs protocol-relative", () => {
    assert.equal(classifyMissionProseHref("javascript:alert(1)"), null);
    assert.equal(classifyMissionProseHref("data:text/html,x"), null);
    assert.equal(classifyMissionProseHref("//evil.example/"), null);
    assert.equal(isSafeInternalPath("//evil.example/"), false);
    assert.equal(isSafeInternalPath("/http://evil.example"), false);
    assert.equal(isSafeInternalPath("outils/regles-metier"), false);
  });
});

describe("parseMissionProseInlines", () => {
  it("conserve le texte sans lien", () => {
    assert.deepEqual(parseMissionProseInlines("Bonjour"), [
      { type: "text", value: "Bonjour" },
    ]);
  });

  it("extrait un lien Markdown http(s)", () => {
    const inlines = parseMissionProseInlines("voir [DOPAMIN](https://example.com/x) ici");
    assert.deepEqual(inlines, [
      { type: "text", value: "voir " },
      {
        type: "link",
        href: "https://example.com/x",
        label: "DOPAMIN",
        kind: "external",
      },
      { type: "text", value: " ici" },
    ]);
  });

  it("extrait un lien Markdown vers un chemin interne", () => {
    const inlines = parseMissionProseInlines(
      "Voir [Documentation](/outils/regles-metier) pour le guide.",
    );
    assert.deepEqual(inlines, [
      { type: "text", value: "Voir " },
      {
        type: "link",
        href: "/outils/regles-metier",
        label: "Documentation",
        kind: "internal",
      },
      { type: "text", value: " pour le guide." },
    ]);
  });

  it("laisse tel quel un schéma non autorisé", () => {
    const raw = "[x](javascript:alert(1))";
    assert.deepEqual(parseMissionProseInlines(raw), [{ type: "text", value: raw }]);
  });

  it("laisse tel quel une URL protocol-relative", () => {
    const raw = "[x](//evil.example/phish)";
    assert.deepEqual(parseMissionProseInlines(raw), [{ type: "text", value: raw }]);
  });

  it("extrait le gras Markdown **…**", () => {
    assert.deepEqual(parseMissionProseInlines("**🎯 Objectif** suite"), [
      { type: "bold", value: "🎯 Objectif" },
      { type: "text", value: " suite" },
    ]);
  });

  it("combine gras et lien", () => {
    assert.deepEqual(
      parseMissionProseInlines("**Intro** puis [lien](https://a.test)."),
      [
        { type: "bold", value: "Intro" },
        { type: "text", value: " puis " },
        { type: "link", href: "https://a.test", label: "lien", kind: "external" },
        { type: "text", value: "." },
      ],
    );
  });

  it("extrait le code inline `…`", () => {
    assert.deepEqual(parseMissionProseInlines("voir `Plan_activite` ici"), [
      { type: "text", value: "voir " },
      { type: "code", value: "Plan_activite" },
      { type: "text", value: " ici" },
    ]);
  });

  it("ne parse pas gras ni lien à l’intérieur du code inline", () => {
    assert.deepEqual(
      parseMissionProseInlines("avant `**x** [y](https://a.test)` après"),
      [
        { type: "text", value: "avant " },
        { type: "code", value: "**x** [y](https://a.test)" },
        { type: "text", value: " après" },
      ],
    );
  });

  it("combine code inline, gras et lien", () => {
    assert.deepEqual(
      parseMissionProseInlines("**Note** : table `Equipe` et [doc](/outils/regles-metier)."),
      [
        { type: "bold", value: "Note" },
        { type: "text", value: " : table " },
        { type: "code", value: "Equipe" },
        { type: "text", value: " et " },
        {
          type: "link",
          href: "/outils/regles-metier",
          label: "doc",
          kind: "internal",
        },
        { type: "text", value: "." },
      ],
    );
  });

  it("laisse tel quel du HTML dans le code (pas d’interprétation)", () => {
    assert.deepEqual(parseMissionProseInlines("danger `<script>x</script>` ok"), [
      { type: "text", value: "danger " },
      { type: "code", value: "<script>x</script>" },
      { type: "text", value: " ok" },
    ]);
  });
});

describe("parseMissionProse", () => {
  it("sépare paragraphes et listes", () => {
    const blocks = parseMissionProse(
      "Intro.\n\n* Un\n* Deux\n\nFin avec [lien](https://a.test).",
    );
    assert.equal(blocks.length, 3);
    assert.equal(blocks[0]!.type, "paragraph");
    assert.equal(blocks[1]!.type, "list");
    if (blocks[1]!.type === "list") {
      assert.equal(blocks[1].ordered, false);
      assert.equal(blocks[1].items.length, 2);
    }
    assert.equal(blocks[2]!.type, "paragraph");
  });

  it("fusionne les soft-wraps dans un paragraphe", () => {
    const blocks = parseMissionProse("ligne un\nligne deux");
    assert.equal(blocks.length, 1);
    assert.deepEqual(blocks[0], {
      type: "paragraph",
      inlines: [{ type: "text", value: "ligne un ligne deux" }],
    });
  });

  it("formate un extrait type Demande ISTF", () => {
    const blocks = parseMissionProse(
      "(provient de la carte [DOPAMIN](https://teams.microsoft.com/x))\n\nNouvelle demande.\n\n* Scénario 1\n* Scénario 2",
    );
    assert.equal(blocks[0]!.type, "paragraph");
    if (blocks[0]!.type === "paragraph") {
      assert.equal(blocks[0].inlines.some((i) => i.type === "link"), true);
    }
    assert.equal(blocks[2]!.type, "list");
  });

  it("reconnaît les titres Markdown et les listes sans ligne vide", () => {
    const blocks = parseMissionProse(
      "### Backlog rien\n##### Stratégie : Alice\n### ChangeLog\n* 20260715 Atelier\n* 20250905 Suite",
    );
    assert.equal(blocks.length, 4);
    assert.deepEqual(blocks[0], {
      type: "heading",
      level: 3,
      inlines: [{ type: "text", value: "Backlog rien" }],
    });
    assert.deepEqual(blocks[1], {
      type: "heading",
      level: 5,
      inlines: [{ type: "text", value: "Stratégie : Alice" }],
    });
    assert.equal(blocks[2]!.type, "heading");
    assert.equal(blocks[3]!.type, "list");
    if (blocks[3]!.type === "list") {
      assert.equal(blocks[3].ordered, false);
      assert.equal(blocks[3].items.length, 2);
    }
  });

  it("reconnaît les listes numérotées", () => {
    const blocks = parseMissionProse("1. Un\n2. Deux");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]!.type, "list");
    if (blocks[0]!.type === "list") {
      assert.equal(blocks[0].ordered, true);
      assert.equal(blocks[0].items.length, 2);
    }
  });

  it("parse un tableau GFM", () => {
    const blocks = parseMissionProse(
      "| Personne | Métier |\n|----------|--------|\n| Alex | **RU** |\n| Sam | Design |",
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]!.type, "table");
    if (blocks[0]!.type === "table") {
      assert.equal(blocks[0].headers.length, 2);
      assert.equal(blocks[0].rows.length, 2);
      assert.deepEqual(blocks[0].rows[0]![1], [{ type: "bold", value: "RU" }]);
    }
  });

  it("normalise les lignes de tableau à la largeur de l’en-tête", () => {
    const blocks = parseMissionProse(
      "| A | B | C |\n|---|---|---|\n| 1 | 2 |\n| x | y | z | w |",
    );
    assert.equal(blocks[0]!.type, "table");
    if (blocks[0]!.type === "table") {
      assert.equal(blocks[0].rows[0]!.length, 3);
      assert.deepEqual(blocks[0].rows[0]![2], [{ type: "text", value: "" }]);
      assert.equal(blocks[0].rows[1]!.length, 3);
      assert.deepEqual(blocks[0].rows[1]![2], [{ type: "text", value: "z" }]);
    }
  });

  it("parse un bloc code fence avec langage", () => {
    const blocks = parseMissionProse(
      "Avant.\n\n```ts\nconst x = 1;\n**pas gras**\n```\n\nAprès.",
    );
    assert.equal(blocks.length, 3);
    assert.equal(blocks[0]!.type, "paragraph");
    assert.deepEqual(blocks[1], {
      type: "code",
      language: "ts",
      value: "const x = 1;\n**pas gras**",
    });
    assert.equal(blocks[2]!.type, "paragraph");
  });

  it("parse un bloc code fence sans langage", () => {
    const blocks = parseMissionProse("```\nligne 1\nligne 2\n```");
    assert.deepEqual(blocks, [
      { type: "code", language: null, value: "ligne 1\nligne 2" },
    ]);
  });

  it("conserve le HTML brut du fence comme texte (pas d’exécution)", () => {
    const blocks = parseMissionProse("```html\n<script>alert(1)</script>\n```");
    assert.deepEqual(blocks, [
      {
        type: "code",
        language: "html",
        value: "<script>alert(1)</script>",
      },
    ]);
  });

  it("ferme le fence à la fin du texte s’il manque la clôture", () => {
    const blocks = parseMissionProse("```\nsans fin");
    assert.deepEqual(blocks, [
      { type: "code", language: null, value: "sans fin" },
    ]);
  });

  it("reconnaît le code inline dans une liste", () => {
    const blocks = parseMissionProse("* utiliser `fetchTable`");
    assert.equal(blocks[0]!.type, "list");
    if (blocks[0]!.type === "list") {
      assert.deepEqual(blocks[0].items[0], [
        { type: "text", value: "utiliser " },
        { type: "code", value: "fetchTable" },
      ]);
    }
  });
});
