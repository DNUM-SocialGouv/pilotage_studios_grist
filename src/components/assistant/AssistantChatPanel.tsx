/**
 * Panneau de conversation Assistant — tiroir flottant ou intégré à l’accueil.
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
  isAssistantConfigReady,
  loadAssistantConfig,
  saveAssistantConfig,
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
};

export function AssistantChatPanel({ layout, onClose }: AssistantChatPanelProps) {
  const location = useLocation();
  const baseId = useId();
  const urlId = `${baseId}-url`;
  const secretId = `${baseId}-secret`;
  const questionId = `${baseId}-question`;
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<AssistantEssaiConfig>(() => loadAssistantConfig());
  const [draftUrl, setDraftUrl] = useState(config.baseUrl);
  const [draftSecret, setDraftSecret] = useState(config.sharedSecret);
  const [showConfig, setShowConfig] = useState(() => !isAssistantConfigReady(config));
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [sending, setSending] = useState(false);
  /** Libellé d’attente aligné sur l’étape réelle (pas un timer décoratif). */
  const [waitLabel, setWaitLabel] = useState("Préparation de la réponse…");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthHint, setHealthHint] = useState<string | null>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, sending, waitLabel]);

  function persistConfig() {
    const next = saveAssistantConfig({
      baseUrl: draftUrl,
      sharedSecret: draftSecret,
    });
    setConfig(next);
    setDraftUrl(next.baseUrl);
    setDraftSecret(next.sharedSecret);
    setShowConfig(!isAssistantConfigReady(next));
    setError(null);
    setHealthHint(null);
    return next;
  }

  async function checkHealth() {
    const next = persistConfig();
    setChecking(true);
    setError(null);
    setHealthHint(null);
    try {
      const health = await fetchAssistantHealth(next);
      if (health.ok) {
        const model = health.model ? ` · modèle ${health.model}` : "";
        const litellm = health.litellmConfigured === false ? " · LiteLLM non configuré" : "";
        setHealthHint(`Service joignable${model}${litellm}.`);
      } else {
        setHealthHint("Réponse inattendue du service.");
      }
    } catch (err) {
      setError(
        err instanceof AssistantAskError
          ? err.message
          : "Impossible de joindre le service. Vérifiez l’URL et qu’uvicorn tourne.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function sendQuestion() {
    const q = question.trim();
    if (!q || sending) return;

    const next = persistConfig();
    if (!isAssistantConfigReady(next)) {
      setShowConfig(true);
      setError("Indiquez d’abord l’URL du service d’essai (Onyxia).");
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

      if (questionLooksLikeOtherDomain(q) && extractMissionIdFromQuestion(q) == null) {
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
  const shellClass =
    layout === "embedded" ? `${styles.panel} ${styles.panelEmbedded}` : styles.panel;

  return (
    <div
      className={shellClass}
      role={layout === "drawer" ? "dialog" : "region"}
      aria-modal={layout === "drawer" ? false : undefined}
      aria-label="Assistant Pilotage"
    >
      <div className={styles.header}>
        <div>
          <h2 className={`${styles.title} fr-mb-0`}>Assistant Pilotage</h2>
          <p className={`fr-text--sm ${styles.subtitle}`}>
            Posez une question avec le <strong>nom</strong> d’une mission — lecture seule.
          </p>
        </div>
        {layout === "drawer" && onClose ? (
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Fermer l’assistant"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.configBox}>
          <button
            type="button"
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
            aria-expanded={showConfig}
            onClick={() => setShowConfig((v) => !v)}
          >
            {showConfig ? "Masquer la connexion" : "Paramètres de connexion"}
          </button>
          {showConfig ? (
            <div className="fr-mt-2w">
              <div className="fr-input-group fr-mb-2w">
                <label className="fr-label" htmlFor={urlId}>
                  URL du service (port 5000)
                  <span className="fr-hint-text">
                    Ex. https://user-…-user.user.lab.sspcloud.fr
                  </span>
                </label>
                <input
                  id={urlId}
                  className="fr-input"
                  type="url"
                  autoComplete="off"
                  value={draftUrl}
                  onChange={(e) => setDraftUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="fr-input-group fr-mb-2w">
                <label className="fr-label" htmlFor={secretId}>
                  Jeton partagé (Bearer)
                  <span className="fr-hint-text">
                    Même valeur que ASSISTANT_SHARED_SECRET — stocké seulement dans cet
                    onglet (session).
                  </span>
                </label>
                <input
                  id={secretId}
                  className="fr-input"
                  type="password"
                  autoComplete="off"
                  value={draftSecret}
                  onChange={(e) => setDraftSecret(e.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="fr-btn fr-btn--secondary fr-btn--sm"
                  onClick={() => void checkHealth()}
                  disabled={checking || draftUrl.trim().length === 0}
                >
                  {checking ? "Test…" : "Tester la connexion"}
                </button>
                <button
                  type="button"
                  className="fr-btn fr-btn--sm"
                  onClick={() => persistConfig()}
                >
                  Enregistrer
                </button>
              </div>
              {healthHint ? (
                <p className={`fr-text--sm fr-mt-2w ${styles.statusOk}`} role="status">
                  {healthHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={styles.thread} aria-live="polite">
          {thread.length === 0 ? (
            <p className="fr-text--sm fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
              Exemples : « Combien de jours CRA sur la mission VAO ? », « Quel TTC sur
              JPME ? ». Les chiffres viennent de Grist (mêmes règles que la fiche).
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
