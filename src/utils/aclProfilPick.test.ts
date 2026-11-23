import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emailFromAclProfilFields,
  pickAclProfilRow,
  preferEffectiveSessionEmail,
  sessionEmailFromAclRows,
} from "./aclProfilPick.ts";

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

describe("sessionEmailFromAclRows", () => {
  it("lit l’e-mail unique de la formule Email_session", () => {
    assert.equal(
      sessionEmailFromAclRows([
        { id: 1, E_mail: "olivier@example.fr", Email_session: "norman@example.fr" },
        { id: 5, E_mail: "norman@example.fr", Email_session: "Norman@Example.FR" },
      ]),
      "norman@example.fr",
    );
  });

  it("ignore la colonne absente, vide ou censurée", () => {
    assert.equal(sessionEmailFromAclRows([{ id: 1, E_mail: "a@b.fr" }]), null);
    assert.equal(
      sessionEmailFromAclRows([{ id: 1, Email_session: "CENSORED" }]),
      null,
    );
  });

  it("refuse deux e-mails de session différents", () => {
    assert.equal(
      sessionEmailFromAclRows([
        { Email_session: "a@b.fr" },
        { Email_session: "c@d.fr" },
      ]),
      null,
    );
  });
});

describe("preferEffectiveSessionEmail", () => {
  it("préfère la personne affichée au jeton du navigateur", () => {
    const rows = [
      { E_mail: "olivier@example.fr", Email_session: "dominique@example.fr" },
      { E_mail: "dominique@example.fr", Email_session: "dominique@example.fr" },
    ];
    assert.equal(
      preferEffectiveSessionEmail("olivier@example.fr", rows),
      "dominique@example.fr",
    );
    assert.equal(
      pickAclProfilRow(
        rows.map((row, index) => ({ ...row, id: index + 1 })),
        preferEffectiveSessionEmail("olivier@example.fr", rows),
      )?.id,
      2,
    );
  });

  it("retombe sur le jeton si la formule n’est pas là", () => {
    assert.equal(
      preferEffectiveSessionEmail("olivier@example.fr", [
        { E_mail: "olivier@example.fr" },
      ]),
      "olivier@example.fr",
    );
  });
});
