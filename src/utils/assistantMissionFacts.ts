/**
 * Outil métier #140 — faits chiffrés mission pour l’assistant (pas le LLM).
 * Règle : CRA avec prestation uniquement (`filterRealiseWithPrestation` via agrégat).
 * Usage cible : questions par **nom** de mission ; l’id reste un secours, pas poussé dans l’UX.
 */
import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import { aggregateCraByMissionId } from "./craByMission.ts";
import { formatMontantEur } from "./formatMontant.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { enfantsOfMaster } from "./missionEnfants.ts";

export type MissionAssistantFacts = {
  tool: "mission_cra";
  missionId: number;
  missionLabel: string;
  joursCra: number;
  ttcCra: number;
  lignesCra: number;
  joursEnvisagesPrestations: number;
  joursCraLabel: string;
  ttcCraLabel: string;
  rule: string;
  dataIncomplete?: boolean;
  dataIncompleteHint?: string;
};

/** Faits pour une question de règle métier (sans mission précise). */
export type MissionRuleFacts = {
  tool: "mission_cra_rule";
  rule: string;
  answer: boolean;
  answerLabel: string;
};

export type MissionAssistantUnresolved = {
  tool: "mission_cra";
  unresolved: true;
  reason: "not_found" | "ambiguous" | "need_mission" | "load_error" | "wrong_domain";
  hint: string;
  /** Libellés candidats (ambiguïté) — pour que le modèle les cite. */
  candidates?: string[];
};

export type MissionAssistantFactsResult =
  | MissionAssistantFacts
  | MissionRuleFacts
  | MissionAssistantUnresolved;

const HINT_NEED_MISSION =
  "Précisez le nom de la mission (tel qu’il apparaît dans la liste Missions).";
const HINT_AMBIGUOUS =
  "Plusieurs missions correspondent. Précisez le nom un peu plus (ex. le libellé complet).";
const HINT_NOT_FOUND_NAME =
  "Aucune mission visible ne correspond à ce nom. Vérifiez l’orthographe ou choisissez un autre libellé.";

function normalizeLabel(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function formatJoursFr(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function missionLabel(m: Mission): string {
  return (m.Nom_de_la_mission ?? "").trim() || `Mission #${m.id}`;
}

/**
 * Mots trop banals pour matcher une mission dans une question du type
 * « consommé pour la mission JPME » (sinon « pour » / « mission » égalisent tout le monde).
 */
const MISSION_TOKEN_STOPWORDS = new Set([
  "mission",
  "missions",
  "pour",
  "sur",
  "avec",
  "dans",
  "chez",
  "vers",
  "sous",
  "sans",
  "dont",
  "cette",
  "les",
  "des",
  "une",
  "aux",
  "par",
  "est",
  "son",
  "ses",
  "leur",
  "leurs",
  "quel",
  "quels",
  "quelle",
  "quelles",
  "effort",
  "partie",
  "produit",
  "produits",
  "studio",
  "studios",
  "accompagnement",
  "investigation", // trop fréquent → l’acronyme (JPME…) porte le match
  "cadrage",
  "realisation",
  "appui",
  "audit",
  "audits",
]);

/** Jetons utiles d’un libellé (acronymes ≥ 3, mots ≥ 4) hors stopwords. */
export function significantMissionTokens(label: string): string[] {
  const parts = normalizeLabel(label).split(/[^a-z0-9]+/).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (MISSION_TOKEN_STOPWORDS.has(p)) continue;
    if (p.length >= 4) out.push(p);
    else if (p.length >= 3 && /^[a-z0-9]+$/.test(p)) out.push(p); // VAO, JPME…
  }
  return out;
}

/** Acronyme / code court distinctif (JPME, VAO, SIAM…). */
function isDistinctiveShortToken(token: string): boolean {
  return token.length >= 3 && token.length <= 6 && /^[a-z0-9]+$/.test(token);
}

function tokenAsWordInQuestion(q: string, token: string): boolean {
  const re = new RegExp(`(?:^|[^a-z0-9])${token}(?:[^a-z0-9]|$)`, "i");
  return re.test(q);
}

/**
 * Question clairement hors domaine mission (BDC / catalogue produit).
 * Ne pas matcher « Réalisation du produit VAO » (nom de mission).
 */
export function questionLooksLikeOtherDomain(question: string): boolean {
  const q = normalizeLabel(question);
  if (/\bbdc\b/.test(q) || /\bbon(?:s)? de commande\b/.test(q)) {
    return true;
  }
  if (/\bmissions?\b.{0,40}\bliee?s?\b.{0,20}\bproduit\b/.test(q)) return true;
  if (/\bproduit\s+(?:id\s*[:=]?\s*)?\d+\b/.test(q)) return true;
  if (/\bproduit\s+accolade\b/.test(q)) return true;
  return false;
}

/** Question sur la règle « CRA sans prestation » (sans exiger une mission). */
export function questionLooksLikeCraPrestationRule(question: string): boolean {
  const q = normalizeLabel(question);
  const aboutOrphans =
    q.includes("sans prestation") ||
    q.includes("pas de prestation") ||
    q.includes("orphel");
  if (!aboutOrphans) return false;
  return (
    /\bcra\b/.test(q) ||
    /\bcompt/.test(q) ||
    /\btotal/.test(q) ||
    /\binclu/.test(q) ||
    /\bexclu/.test(q)
  );
}

/** Id mission depuis l’URL MemoryRouter `/missions/:id`. */
export function missionIdFromPath(pathname: string): number | null {
  const m = /^\/missions\/(\d+)\b/.exec(pathname);
  if (!m?.[1]) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Extrait un id mission si présent (secours).
 * Ne matche pas un bare « id 1 » (évite BDC / produit).
 */
export function extractMissionIdFromQuestion(question: string): number | null {
  if (questionLooksLikeOtherDomain(question)) {
    const missionScoped = /\bmission\s*(?:id\s*[:=]?\s*|#:?\s*)?(\d{1,6})\b/i.exec(question);
    if (missionScoped?.[1]) {
      const id = Number(missionScoped[1]);
      return Number.isFinite(id) && id > 0 ? id : null;
    }
    return null;
  }

  const patterns = [
    /\bmission\s*(?:id\s*[:=]?\s*|#:?\s*)?(\d{1,6})\b/i,
    /\bmission\s+[^\d]{0,80}?\(id\s*[:=]?\s*(\d{1,6})\)/i,
    /\(#\s*(\d{1,6})\s*\)/,
  ];
  for (const re of patterns) {
    const m = re.exec(question);
    if (m?.[1]) {
      const id = Number(m[1]);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }

  if (/\b(mission|cra|jours?|ttc|consom)\b/i.test(normalizeLabel(question))) {
    const bare = /\(id\s*[:=]?\s*(\d{1,6})\)/i.exec(question);
    if (bare?.[1]) {
      const id = Number(bare[1]);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }

  return null;
}

type MissionScore = { mission: Mission; score: number };

function scoreMissionAgainstQuestion(questionNorm: string, m: Mission): number {
  const label = normalizeLabel(m.Nom_de_la_mission ?? "");
  if (!label) return 0;

  // Libellé complet contenu dans la question.
  if (label.length >= 4 && questionNorm.includes(label)) {
    return 1000 + label.length;
  }

  // Jetons distinctifs présents comme mots dans la question.
  const tokens = significantMissionTokens(label);
  let score = 0;
  let hits = 0;
  let distinctiveHits = 0;
  for (const t of tokens) {
    if (!tokenAsWordInQuestion(questionNorm, t)) continue;
    hits += 1;
    if (isDistinctiveShortToken(t)) {
      // JPME / VAO : fort signal, même seul.
      distinctiveHits += 1;
      score += 200 + t.length * 10;
    } else {
      score += t.length * 10;
    }
  }
  if (hits === 0) return 0;
  if (hits >= 2) score += 50;
  if (distinctiveHits > 0) score += 100;
  return score;
}

/** Meilleurs scores à égalité (pour message d’ambiguïté). */
export function topMissionMatches(
  question: string,
  missions: readonly Mission[],
  limit = 5,
): Mission[] {
  const q = normalizeLabel(question);
  const scored: MissionScore[] = [];
  for (const m of missions) {
    const score = scoreMissionAgainstQuestion(q, m);
    if (score > 0) scored.push({ mission: m, score });
  }
  scored.sort((a, b) => b.score - a.score || a.mission.id - b.mission.id);
  if (scored.length === 0) return [];
  const best = scored[0]!.score;
  return scored.filter((s) => s.score === best).slice(0, limit).map((s) => s.mission);
}

/**
 * Résout une mission : id explicite (secours), sinon meilleur score sur le nom / jetons.
 * En cas d’égalité de score → null (ambigu).
 */
export function resolveMissionFromQuestion(
  question: string,
  missions: readonly Mission[],
): Mission | null {
  const byId = extractMissionIdFromQuestion(question);
  if (byId != null) {
    return missions.find((m) => m.id === byId) ?? null;
  }

  const q = normalizeLabel(question);
  const scored: MissionScore[] = [];
  for (const m of missions) {
    const score = scoreMissionAgainstQuestion(q, m);
    if (score > 0) scored.push({ mission: m, score });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  const second = scored[1];
  if (second && second.score === best.score) return null;
  return best.mission;
}

export function isAmbiguousMissionNameMatch(
  question: string,
  missions: readonly Mission[],
): boolean {
  if (extractMissionIdFromQuestion(question) != null) return false;
  const q = normalizeLabel(question);
  const scored: MissionScore[] = [];
  for (const m of missions) {
    const score = scoreMissionAgainstQuestion(q, m);
    if (score > 0) scored.push({ mission: m, score });
  }
  if (scored.length < 2) return false;
  scored.sort((a, b) => b.score - a.score);
  return scored[0]!.score === scored[1]!.score;
}

export function questionLooksLikeMissionCra(question: string): boolean {
  if (questionLooksLikeCraPrestationRule(question)) return true;
  if (questionLooksLikeOtherDomain(question) && extractMissionIdFromQuestion(question) == null) {
    return false;
  }
  const q = normalizeLabel(question);
  if (extractMissionIdFromQuestion(question) != null) return true;
  const patterns = [
    /\bjours?\b/,
    /\bcra\b/,
    /\bttc\b/,
    /consom/,
    /\bbudget\b/,
    /\bmission\b/,
    /\bprestation/,
    /realis/,
  ];
  return patterns.some((re) => re.test(q));
}

export function questionAllowsPathMissionFallback(question: string): boolean {
  if (questionLooksLikeOtherDomain(question)) return false;
  const q = normalizeLabel(question);
  return (
    /\bjours?\b/.test(q) ||
    /\bcra\b/.test(q) ||
    /\bttc\b/.test(q) ||
    /consom/.test(q) ||
    /\bprestation/.test(q)
  );
}

export function sumJoursEnvisagesPrestations(
  enfants: readonly MissionEnfant[],
  missionId: number,
): number {
  let sum = 0;
  for (const e of enfantsOfMaster(enfants as MissionEnfant[], missionId)) {
    if (typeof e.Jours_envisages === "number" && Number.isFinite(e.Jours_envisages)) {
      sum += e.Jours_envisages;
    }
  }
  return sum;
}

export function buildMissionAssistantFacts(
  mission: Mission,
  suivi: readonly SuiviMensuel[],
  enfants: readonly MissionEnfant[],
  opts?: { dataIncomplete?: boolean; dataIncompleteHint?: string },
): MissionAssistantFacts {
  const totaux =
    aggregateCraByMissionId([...suivi], [...enfants]).get(mission.id) ?? {
      jours: 0,
      ttc: 0,
      count: 0,
    };
  const joursEnvisages = sumJoursEnvisagesPrestations(enfants, mission.id);
  const facts: MissionAssistantFacts = {
    tool: "mission_cra",
    missionId: mission.id,
    missionLabel: missionLabel(mission),
    joursCra: totaux.jours,
    ttcCra: totaux.ttc,
    lignesCra: totaux.count,
    joursEnvisagesPrestations: joursEnvisages,
    joursCraLabel: formatJoursFr(totaux.jours),
    ttcCraLabel: formatMontantEur(totaux.ttc),
    rule: "Un CRA compte seulement s’il est lié à une prestation.",
  };
  if (opts?.dataIncomplete) {
    facts.dataIncomplete = true;
    facts.dataIncompleteHint =
      opts.dataIncompleteHint ??
      "Données Grist incomplètes (prestations ou CRA partiels) : les totaux peuvent être faux.";
  }
  return facts;
}

export function buildCraPrestationRuleFacts(): MissionRuleFacts {
  return {
    tool: "mission_cra_rule",
    rule: "Un CRA compte seulement s’il est lié à une prestation.",
    answer: false,
    answerLabel:
      "Non. Les CRA sans prestation ne comptent pas dans les totaux mission (jours / TTC).",
  };
}

export function resolveMissionAssistantFacts(
  question: string,
  missions: readonly Mission[],
  suivi: readonly SuiviMensuel[],
  enfants: readonly MissionEnfant[],
  pathname?: string,
  opts?: { refsError?: string | null },
): MissionAssistantFactsResult | null {
  if (questionLooksLikeCraPrestationRule(question)) {
    return buildCraPrestationRuleFacts();
  }

  if (questionLooksLikeOtherDomain(question) && extractMissionIdFromQuestion(question) == null) {
    return {
      tool: "mission_cra",
      unresolved: true,
      reason: "wrong_domain",
      hint: "Cette question semble porter sur un bon de commande ou un produit. L’outil mission répond aux questions sur une mission nommée (jours / TTC CRA).",
    };
  }

  if (!questionLooksLikeMissionCra(question)) {
    return null;
  }

  const incomplete =
    typeof opts?.refsError === "string" && opts.refsError.trim().length > 0
      ? { dataIncomplete: true as const, dataIncompleteHint: opts.refsError.trim() }
      : undefined;

  const explicitId = extractMissionIdFromQuestion(question);
  if (explicitId != null) {
    const mission = missions.find((m) => m.id === explicitId);
    if (!mission) {
      return {
        tool: "mission_cra",
        unresolved: true,
        reason: "not_found",
        hint: HINT_NOT_FOUND_NAME,
      };
    }
    return buildMissionAssistantFacts(mission, suivi, enfants, incomplete);
  }

  const top = topMissionMatches(question, missions);
  if (top.length > 1) {
    const labels = top.map((m) => missionLabel(m));
    return {
      tool: "mission_cra",
      unresolved: true,
      reason: "ambiguous",
      hint: `${HINT_AMBIGUOUS} Missions possibles : ${labels.join(" · ")}.`,
      candidates: labels,
    };
  }
  if (top.length === 1) {
    return buildMissionAssistantFacts(top[0]!, suivi, enfants, incomplete);
  }

  if (pathname && questionAllowsPathMissionFallback(question)) {
    const pathId = missionIdFromPath(pathname);
    if (pathId != null) {
      const mission = missions.find((m) => m.id === pathId);
      if (mission) {
        return buildMissionAssistantFacts(mission, suivi, enfants, incomplete);
      }
    }
  }

  return {
    tool: "mission_cra",
    unresolved: true,
    reason: "need_mission",
    hint: HINT_NEED_MISSION,
  };
}

export function missionFactsForAssistantPrompt(
  facts: MissionAssistantFactsResult,
): Record<string, unknown> {
  if ("unresolved" in facts) {
    return {
      ...facts,
      instruction:
        "Explique le problème en français courant. Demande le **nom** de la mission (pas un numéro technique). Ne invente aucun chiffre. N’affiche jamais de noms de champs techniques.",
    };
  }
  if (facts.tool === "mission_cra_rule") {
    return {
      ...facts,
      instruction:
        "Réponds clairement avec answerLabel. Une phrase suffit. N’invente pas d’exception. N’affiche aucun nom de champ technique.",
    };
  }
  const incompleteNote = facts.dataIncomplete
    ? " Les données Grist sont incomplètes : dis-le clairement et ne présente pas les totaux comme sûrs."
    : "";
  return {
    ...facts,
    instruction:
      `Utilise uniquement ces faits. Réponds en français courant avec les valeurs de joursCraLabel et ttcCraLabel, ` +
      `mais **n’écris jamais** les mots joursCraLabel, ttcCraLabel, missionId ni aucun nom de champ. ` +
      `Cite le nom de la mission (missionLabel). Ne recalcule pas.${incompleteNote}`,
  };
}

export function prestationBelongsToMission(
  enfant: MissionEnfant,
  missionId: number,
): boolean {
  return extractGristReferenceId(enfant.Mission) === missionId;
}
