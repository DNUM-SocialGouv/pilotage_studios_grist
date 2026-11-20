/**
 * Panneau de conversation Assistant — tiroir flottant ou intégré à l’accueil.
 * Connexion Onyxia : menu compte → « Connexion Assistant » (pas ici).
 */
import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { loadMissionsTables } from "../../hooks/useMissionsData.ts";
import {
  askAssistant,
  AssistantAskError,
  fetchAssistantHealth,
  type AssistantAskContext,
} from "../../utils/assistantAsk.ts";
import {
  ASSISTANT_CONFIG_CHANGED_EVENT,
  isAssistantConfigReady,
  loadAssistantConfig,
  requestAssistantConnexionDialog,
  type AssistantEssaiConfig,
} from "../../utils/assistantConfig.ts";
import {
  extractMissionIdFromQuestion,
  missionFactsForAssistantPrompt,
  questionLooksLikeMissionCra,
  questionLooksLikeOtherDomain,
  resolveMissionAssistantFacts,
} from "../../utils/assistantMissionFacts.ts";
import { MissionProse } from "../missions/MissionProse.tsx";
import styles from "./AssistantWidget.module.css";

export type AssistantChatLayout = "drawer" | "embedded";

/** Domaine de faits : Pilotage (missions/CRA) ou référentiel Le PARC (serveur). */
export type AssistantChatDomain = "pilotage" | "parc";

type ThreadItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export type AssistantChatPanelProps = {
  layout: AssistantChatLayout;
  /** Tiroir uniquement : bouton fermer. */
  onClose?: () => void;
  /** Défaut : pilotage (missions). `parc` = faits côté serveur Le PARC. */
  domain?: AssistantChatDomain;
};

export function AssistantChatPanel({
  layout,
  onClose,
  domain = "pilotage",
}: AssistantChatPanelProps) {
  const location = useLocation();
  const baseId = useId();
  const questionId = `${baseId}-question`;
  const threadEndRef = useRef<HTMLDivElement>(null);
  const isParc = domain === "parc";

  const [config, setConfig] = useState<AssistantEssaiConfig>(() => loadAssistantConfig());
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [sending, setSending] = useState(false);
  /** Libellé d’attente aligné sur l’étape réelle (pas un timer décoratif). */
  const [waitLabel, setWaitLabel] = useState("Préparation de la réponse…");
  const [error, setError] = useState<string | null>(null);
  /** Banner PARC : service joignable mais sans lecture Le PARC. */
  const [parcHealthHint, setParcHealthHint] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setConfig(loadAssistantConfig());
    window.addEventListener(ASSISTANT_CONFIG_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ASSISTANT_CONFIG_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!isParc) {
      setParcHealthHint(null);
      return;
    }
    const cfg = loadAssistantConfig();
    if (!isAssistantConfigReady(cfg)) {
      setParcHealthHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const health = await fetchAssistantHealth(cfg);
        if (cancelled) return;
        if (health.parcConfigured === true) {
          setParcHealthHint(null);
          return;
        }
        if (health.runtime === "node" || health.parcConfigured === false) {
          setParcHealthHint(
            "Le service connecté ne lit pas encore Le PARC (runtime Node, ou variables GRIST_* absentes). Sur Onyxia : `uvicorn app:app`, `.env` avec GRIST_BASE_URL / GRIST_API_KEY / GRIST_DOC_ID_PARC, puis Tester la connexion → « PARC prêt ».",
          );
          return;
        }
        // Ancien /health sans parcConfigured : on ne bloque pas, le serveur tranchera.
        setParcHealthHint(
          "Ce service ne signale pas encore « parcConfigured ». Mettez à jour le code Onyxia (`git pull`) et vérifiez les variables GRIST_*.",
        );
      } catch {
        if (!cancelled) setParcHealthHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isParc, config.baseUrl]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, sending, waitLabel]);

  async function sendQuestion() {
    const q = question.trim();
    if (!q || sending) return;

    const next = loadAssistantConfig();
    setConfig(next);
    if (!isAssistantConfigReady(next)) {
      setError("Indiquez d’abord l’URL du service via Connexion Assistant.");
      requestAssistantConnexionDialog();
      return;
    }

    setSending(true);
    setWaitLabel("Préparation de la réponse…");
    setError(null);
    setQuestion("");
    setThread((prev) => [...prev, { id: newId(), role: "user", text: q }]);

    try {
      const context: AssistantAskContext = {
        screen: location.pathname,
      };

      if (isParc) {
        context.entityType = "parc_produit";
        setWaitLabel("Lecture du référentiel produits…");
      } else if (questionLooksLikeOtherDomain(q) && extractMissionIdFromQuestion(q) == null) {
        context.facts = missionFactsForAssistantPrompt({
          tool: "mission_cra",
          unresolved: true,
          reason: "wrong_domain",
          hint: "Cette question semble porter sur un bon de commande ou un produit. Posez plutôt une question sur une mission par son nom (jours / TTC CRA).",
        });
      } else if (questionLooksLikeMissionCra(q)) {
        setWaitLabel("Lecture des missions et des CRA…");
        try {
          const tables = await loadMissionsTables();
          setWaitLabel("Calcul des totaux…");
          const resolved = resolveMissionAssistantFacts(
            q,
            tables.missions,
            tables.suivi,
            tables.missionEnfants,
            location.pathname,
            { refsError: tables.refsError },
          );
          if (resolved) {
            context.facts = missionFactsForAssistantPrompt(resolved);
            if (!("unresolved" in resolved) && resolved.tool === "mission_cra") {
              context.entityType = "mission";
              context.entityId = resolved.missionId;
              context.entityLabel = resolved.missionLabel;
            }
          }
        } catch {
          context.facts = missionFactsForAssistantPrompt({
            tool: "mission_cra",
            unresolved: true,
            reason: "load_error",
            hint: "Impossible de lire les missions / CRA dans Grist pour cette session.",
          });
        }
      }

      setWaitLabel("Rédaction de la réponse…");
      const result = await askAssistant(next, q, context);
      setThread((prev) => [
        ...prev,
        { id: newId(), role: "assistant", text: result.message },
      ]);
    } catch (err) {
      const msg =
        err instanceof AssistantAskError
          ? err.message
          : "Envoi impossible. Vérifiez le service Onyxia puis réessayez.";
      setError(msg);
      setThread((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          text: `Je n’ai pas pu répondre : ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const canSend = question.trim().length > 0 && !sending;
  const configReady = isAssistantConfigReady(config);
  const shellClass =
    layout === "embedded" ? `${styles.panel} ${styles.panelEmbedded}` : styles.panel;

  return (
    <div
      className={shellClass}
      role={layout === "drawer" ? "dialog" : "region"}
      aria-modal={layout === "drawer" ? false : undefined}
      aria-label={isParc ? "Assistant PARC" : "Assistant Pilotage"}
    >
      <div className={styles.header}>
        <div>
          <h2 className={`${styles.title} fr-mb-0`}>
            {isParc ? "Assistant PARC" : "Assistant Pilotage"}
          </h2>
          <p className={`fr-text--sm ${styles.subtitle}`}>
            {isParc ? (
              <>
                Posez une question avec le <strong>nom</strong> d’un produit — lecture seule
                (Le PARC).
              </>
            ) : (
              <>
                Posez une question avec le <strong>nom</strong> d’une mission — lecture seule.
              </>
            )}
          </p>
        </div>
        {layout === "drawer" && onClose ? (
          <button
            type="button"
            className={styles.closeBtn}
            aria-label={isParc ? "Fermer l’assistant PARC" : "Fermer l’assistant"}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <div className={styles.body}>
        {!configReady ? (
          <div className={styles.configHint} role="status">
            <p className="fr-text--sm fr-mb-1w">
              Pour brancher l’essai : renseignez l’URL et le jeton du service Onyxia.
            </p>
            <button
              type="button"
              className="fr-btn fr-btn--secondary fr-btn--sm"
              onClick={() => requestAssistantConnexionDialog()}
            >
              Connexion Assistant
            </button>
          </div>
        ) : null}

        {isParc && configReady && parcHealthHint ? (
          <div className={styles.configHint} role="status">
            <p className="fr-text--sm fr-mb-1w">{parcHealthHint}</p>
            <button
              type="button"
              className="fr-btn fr-btn--secondary fr-btn--sm"
              onClick={() => requestAssistantConnexionDialog()}
            >
              Connexion Assistant
            </button>
          </div>
        ) : null}

        <div className={styles.thread} aria-live="polite">
          {thread.length === 0 ? (
            <p className="fr-text--sm fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
              {isParc ? (
                <>
                  Exemples : « Quel hébergeur pour Accolade ? », « Quel département SDPC pour
                  Accolade ? », « Accolade est-il en monorepo ? ». Les infos viennent du
                  référentiel Le PARC.
                </>
              ) : (
                <>
                  Exemples : « Combien de jours CRA sur la mission VAO ? », « Quel TTC sur
                  JPME ? ». Les chiffres viennent de Grist (mêmes règles que la fiche).
                </>
              )}
            </p>
          ) : null}
          {thread.map((item) =>
            item.role === "user" ? (
              <div key={item.id} className={styles.bubbleUser}>
                {item.text}
              </div>
            ) : (
              <div key={item.id} className={styles.bubbleAssistant}>
                <div className={styles.prose}>
                  <MissionProse value={item.text} />
                </div>
              </div>
            ),
          )}
          {sending ? (
            <div className={`${styles.bubbleAssistant} ${styles.waiting}`} role="status">
              <span className={styles.loaderDots} aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span>{waitLabel}</span>
            </div>
          ) : null}
          <div ref={threadEndRef} />
        </div>

        {error ? (
          <p className={`fr-text--sm ${styles.error}`} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.composer}>
          <div className="fr-input-group fr-mb-0">
            <label className="fr-label" htmlFor={questionId}>
              Votre question
            </label>
            <textarea
              id={questionId}
              className="fr-input"
              rows={layout === "embedded" ? 4 : 3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendQuestion();
                }
              }}
              disabled={sending}
            />
          </div>
          <div className={styles.actions}>
            {layout === "drawer" && onClose ? (
              <button
                type="button"
                className="fr-btn fr-btn--secondary fr-btn--sm"
                onClick={onClose}
                disabled={sending}
              >
                Fermer
              </button>
            ) : null}
            <button
              type="button"
              className="fr-btn fr-btn--sm"
              onClick={() => void sendQuestion()}
              disabled={!canSend}
            >
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
