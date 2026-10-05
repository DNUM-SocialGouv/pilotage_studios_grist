import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { KanbanCommentaireItem } from "./kanbanCommentaires.ts";
import type { KanbanTicket } from "./kanbanTickets.ts";
import {
  buildVosRetoursItems,
  computeVosRetourNovelty,
  filterMesRetoursFeedback,
  hasOtherReplySignal,
  shouldShowVosRetoursBlock,
} from "./vosRetours.ts";
import {
  markVosRetourSeen,
  readVosRetoursLastSeen,
} from "./vosRetoursLastSeen.ts";

function ticket(partial: Partial<KanbanTicket> & Pick<KanbanTicket, "id">): KanbanTicket {
  return {
    id: partial.id,
    nature: partial.nature ?? "Feedback",
    column: partial.column ?? "feedback",
    title: partial.title ?? `Ticket ${partial.id}`,
    resume: partial.resume ?? "",
    theme: partial.theme ?? "",
    status: partial.status ?? "later",
    guideLead: "",
    guideIntro: "",
    guideSteps: [],
    pagePath: "",
    pageLinkLabel: "",
    lienGithub: "",
    cle: "",
    ordre: 0,
    dateLabel: partial.dateLabel ?? "",
    dateSort: partial.dateSort ?? 0,
    auteur: partial.auteur ?? "Alice",
    email: partial.email ?? "alice@example.com",
    type: partial.type ?? "Suggestion",
    page: "",
    message: "",
    niveauGene: "",
    statutFeedback: "",
    reponse: partial.reponse ?? "",
  };
}

function comment(
  partial: Partial<KanbanCommentaireItem> & Pick<KanbanCommentaireItem, "id" | "cibleId">,
): KanbanCommentaireItem {
  return {
    id: partial.id,
    cibleId: partial.cibleId,
    dateLabel: "",
    dateSort: partial.dateSort ?? 0,
    auteur: partial.auteur ?? "Bob",
    email: partial.email ?? "bob@example.com",
    message: partial.message ?? "ok",
  };
}

describe("shouldShowVosRetoursBlock", () => {
  it("masque unknown / e-mail absent", () => {
    assert.equal(shouldShowVosRetoursBlock(null, "admin"), false);
    assert.equal(shouldShowVosRetoursBlock("a@b.fr", "unknown"), false);
    assert.equal(shouldShowVosRetoursBlock("CENSORED", "invite"), false);
  });

  it("affiche pour Invité avec e-mail", () => {
    assert.equal(shouldShowVosRetoursBlock("invite@example.com", "invite"), true);
  });
});

describe("filterMesRetoursFeedback", () => {
  it("ne garde que Feedback + e-mail session", () => {
    const rows = [
      ticket({ id: 1, email: "alice@example.com" }),
      ticket({ id: 2, email: "bob@example.com" }),
      ticket({ id: 3, nature: "Produit", email: "alice@example.com" }),
      ticket({ id: 4, email: "  Alice@Example.com ", column: "livre" }),
    ];
    const mine = filterMesRetoursFeedback(rows, "alice@example.com");
    assert.deepEqual(
      mine.map((t) => t.id),
      [1, 4],
    );
  });
});

describe("computeVosRetourNovelty", () => {
  it("priorise Nouvelle réponse sur Mis à jour", () => {
    const t = ticket({ id: 1, column: "livre", reponse: "Traité" });
    assert.equal(computeVosRetourNovelty(t, [], {}), "nouvelle_reponse");
  });

  it("signale Mis à jour si colonne ≠ feedback (jamais lu)", () => {
    const t = ticket({ id: 2, column: "en_cours" });
    assert.equal(computeVosRetourNovelty(t, [], {}), "mis_a_jour");
  });

  it("signale réponse d’autrui après lastSeen", () => {
    const t = ticket({ id: 3, column: "feedback" });
    const comments = [comment({ id: 10, cibleId: 3, dateSort: 2_000, email: "ops@example.com" })];
    const lastSeen = { "3": { seenAt: 1_000, column: "feedback" } };
    assert.equal(computeVosRetourNovelty(t, comments, lastSeen), "nouvelle_reponse");
  });

  it("ignore ses propres commentaires", () => {
    const t = ticket({ id: 4, email: "alice@example.com" });
    const comments = [
      comment({ id: 11, cibleId: 4, dateSort: 5_000, email: "alice@example.com" }),
    ];
    const lastSeen = { "4": { seenAt: 1_000, column: "feedback" } };
    assert.equal(computeVosRetourNovelty(t, comments, lastSeen), null);
    assert.equal(hasOtherReplySignal(t, comments), false);
  });

  it("signale Mis à jour si colonne a changé depuis lastSeen", () => {
    const t = ticket({ id: 5, column: "livre" });
    const lastSeen = { "5": { seenAt: 1_000, column: "feedback" } };
    assert.equal(computeVosRetourNovelty(t, [], lastSeen), "mis_a_jour");
  });
});

describe("buildVosRetoursItems", () => {
  it("limite à 5 et trie par activité", () => {
    const tickets = [1, 2, 3, 4, 5, 6].map((id) =>
      ticket({ id, dateSort: id * 1000, email: "a@b.fr" }),
    );
    const items = buildVosRetoursItems({
      tickets,
      comments: [],
      sessionEmail: "a@b.fr",
      lastSeen: {},
      limit: 5,
    });
    assert.equal(items.length, 5);
    assert.deepEqual(
      items.map((i) => i.ticket.id),
      [6, 5, 4, 3, 2],
    );
  });
});

describe("vosRetoursLastSeen", () => {
  it("parse et marque vu", () => {
    assert.deepEqual(readVosRetoursLastSeen("{"), {});
    const storage = {
      store: "" as string,
      getItem() {
        return this.store || null;
      },
      setItem(_k: string, v: string) {
        this.store = v;
      },
    };
    const next = markVosRetourSeen(9, "en_cours", 42_000, storage);
    assert.equal(next["9"]?.column, "en_cours");
    assert.equal(next["9"]?.seenAt, 42_000);
  });
});
