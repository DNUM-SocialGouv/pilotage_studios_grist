import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailFromJwtPayload } from "./gristUserEmail.ts";

function makeJwt(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `hdr.${body}.sig`;
}

describe("emailFromJwtPayload", () => {
  it("lit email / userEmail / sub", () => {
    assert.equal(
      emailFromJwtPayload(makeJwt({ email: "Alice@Example.com" })),
      "alice@example.com",
    );
    assert.equal(
      emailFromJwtPayload(makeJwt({ userEmail: "b@c.fr" })),
      "b@c.fr",
    );
    assert.equal(
      emailFromJwtPayload(makeJwt({ sub: "d@e.fr" })),
      "d@e.fr",
    );
  });

  it("refuse un jeton opaque ou sans e-mail", () => {
    assert.equal(emailFromJwtPayload("not-a-jwt"), null);
    assert.equal(emailFromJwtPayload(makeJwt({ sub: "user-id-only" })), null);
  });
});
