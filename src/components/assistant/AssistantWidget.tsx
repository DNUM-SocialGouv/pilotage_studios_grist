/**
 * Tiroir / panneau flottant Assistant (#139) — essai lecture seule via service Onyxia.
 * Config URL + jeton en sessionStorage (pas de clé LiteLLM dans le bundle).
 */
import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  askAssistant,
  AssistantAskError,
  fetchAssistantHealth,
} from "../../utils/assistantAsk.ts";
import {
  isAssistantConfigReady,
  loadAssistantConfig,
  saveAssistantConfig,
  type AssistantEssaiConfig,
} from "../../utils/assistantConfig.ts";
import styles from "./AssistantWidget.module.css";

type ThreadItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function SparkIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
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

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AssistantWidget() {
  const location = useLocation();
  const baseId = useId();
  const urlId = `${baseId}-url`;
  const secretId = `${baseId}-secret`;
  const questionId = `${baseId}-question`;
  const threadEndRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<AssistantEssaiConfig>(() => loadAssistantConfig());
  const [draftUrl, setDraftUrl] = useState(config.baseUrl);
  const [draftSecret, setDraftSecret] = useState(config.sharedSecret);
  const [showConfig, setShowConfig] = useState(() => !isAssistantConfigReady(config));
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthHint, setHealthHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, thread, sending]);

  function close() {
    setOpen(false);
  }

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

    const next = isAssistantConfigReady(config)
      ? config
      : persistConfig();
    if (!isAssistantConfigReady(next)) {
      setShowConfig(true);
      setError("Indiquez d’abord l’URL du service d’essai (Onyxia).");
      return;
    }

    setSending(true);
    setError(null);
    setQuestion("");
    setThread((prev) => [...prev, { id: newId(), role: "user", text: q }]);

    try {
      const result = await askAssistant(next, q, {
        screen: location.pathname,
      });
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

  return (
    <>
      {open ? (
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-label="Assistant Pilotage"
        >
          <div className={styles.header}>
            <div>
              <h2 className={`${styles.title} fr-mb-0`}>Assistant Pilotage</h2>
              <p className={`fr-text--sm ${styles.subtitle}`}>
                Essai — questions en lecture seule (service Onyxia).
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Fermer l’assistant"
              onClick={close}
            >
              <CloseIcon />
            </button>
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
                  Exemples : « Quel reste sur un bon de commande ? », « Budget consommé sur
                  une mission… ». Les chiffres métier fiables arriveront ensuite (#140–#142).
                </p>
              ) : null}
              {thread.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
                  }
                >
                  {item.text}
                </div>
              ))}
              {sending ? (
                <div className={styles.bubbleAssistant} role="status">
                  Réflexion en cours…
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
                  rows={3}
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
                <button
                  type="button"
                  className="fr-btn fr-btn--secondary fr-btn--sm"
                  onClick={close}
                  disabled={sending}
                >
                  Fermer
                </button>
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
      ) : null}

      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label="Ouvrir l’assistant Pilotage"
        onClick={() => setOpen((v) => !v)}
      >
        <SparkIcon />
        <span>Assistant</span>
      </button>
    </>
  );
}
