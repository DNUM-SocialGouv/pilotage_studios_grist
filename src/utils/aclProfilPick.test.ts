import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailFromAclProfilFields, pickAclProfilRow } from "./aclProfilPick.ts";

describe("emailFromAclProfilFields", () => {
  it("normalise un e-mail lisible", () => {
    assert.equal(emailFromAclProfilFields({ E_mail: "  A@B.fr " }), "a@b.fr");
  });

  it("ignore CENSORED / invalide", () => {
    assert.equal(emailFromAclProfilFields({ E_mail: "CENSORED" }), null);
    assert.equal(emailFromAclProfilFields({ E_mail: "pas-un-mail" }), null);
    assert.equal(emailFromAclProfilFields({}), null);
  });
});

describe("pickAclProfilRow", () => {
  const rows = [
    { id: 1, E_mail: "olivier@example.fr" },
    { id: 5, E_mail: "norman@example.fr" },
    { id: 3, E_mail: "dom@example.fr" },
  ];

  it("privilégie l’e-mail de session (évite le plus petit id)", () => {
    const picked = pickAclProfilRow(rows, "norman@example.fr");
    assert.equal(picked?.id, 5);
  });

  it("est insensible à la casse", () => {
    assert.equal(pickAclProfilRow(rows, "Norman@Example.FR")?.id, 5);
  });

  it("retombe sur la seule ligne si pas de match e-mail", () => {
    assert.equal(
      pickAclProfilRow([{ id: 9, E_mail: "seul@example.fr" }], "autre@example.fr")
        ?.id,
      9,
    );
  });

  it("retombe sur le plus petit id si plusieurs sans match", () => {
    assert.equal(pickAclProfilRow(rows, "inconnu@example.fr")?.id, 1);
    assert.equal(pickAclProfilRow(rows, null)?.id, 1);
  });

  it("retourne null si vide", () => {
    assert.equal(pickAclProfilRow([]), null);
  });
});
