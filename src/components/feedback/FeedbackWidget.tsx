import { useEffect, useId, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAclProfil } from "../../AclProfilContext";
import {
  createKanbanFeedbackRecord,
  FEEDBACK_TITRE_MAX,
  type FeedbackType,
} from "../../utils/createKanbanFeedback";
import { pageOptionFromPathname } from "../../utils/feedbackPages";
import { requestKanbanReload, subscribeOpenFeedback } from "../../utils/feedbackOpen";
import { defaultWeeklyAuteurPrenom } from "../../utils/weeklyAgenda";
import styles from "./FeedbackWidget.module.css";

const TYPES: FeedbackType[] = ["Anomalie", "Suggestion", "Question"];

const HINTS: Record<FeedbackType, string> = {
  Anomalie: "Ce qui s’est passé, ce que vous attendiez, comment le reproduire.",
  Suggestion: "L’amélioration proposée et le besoin auquel elle répond.",
  Question: "Votre question sur l’outil ou une donnée.",
};

const NIVEAUX = [
  "Bloquant — je ne peux pas continuer",
  "Gênant — contournement possible",
  "Mineur — cosmétique / confort",
] as const;

const NO_EMAIL_MESSAGE =
  "Impossible d’identifier votre compte Grist (pas d’e-mail de session). Réessayez depuis le document Pilotage, ou contactez un Admin si le problème continue.";

function ChatIcon() {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
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

function CheckIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-default-success)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

/**
 * Bouton flottant + panneau de feedback → écriture table Grist `Kanban` (Nature=Feedback).
 * Signature silencieuse (session) ; Theme/Page auto via pathname.
 */
export function FeedbackWidget() {
  const location = useLocation();
  const { email: sessionEmail, displayName } = useAclProfil();
  const baseId = useId();
  const titreId = `${baseId}-titre`;
  const msgId = `${baseId}-msg`;
  const niveauId = `${baseId}-niveau`;
  const ctxId = `${baseId}-ctx`;

  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<FeedbackType>("Anomalie");
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [niveau, setNiveau] = useState<string>(NIVEAUX[0]);
  const [joinContext, setJoinContext] = useState(true);

  const sessionEmailTrimmed = (sessionEmail ?? "").trim();
  const hasSessionEmail = sessionEmailTrimmed.length > 0;
  const auteurPrenom = defaultWeeklyAuteurPrenom(displayName, sessionEmail);

  useEffect(() => {
    return subscribeOpenFeedback(() => {
      setOpen(true);
      setSent(false);
      setError(null);
    });
  }, []);

  function close() {
    setOpen(false);
  }

  function resetForm() {
    setSent(false);
    setSending(false);
    setError(null);
    setTitre("");
    setMessage("");
    setType("Anomalie");
    setNiveau(NIVEAUX[0]);
    setJoinContext(true);
  }

  async function submit() {
    if (titre.trim().length === 0 || !hasSessionEmail || !auteurPrenom || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const page = pageOptionFromPathname(location.pathname);
      await createKanbanFeedbackRecord({
        userName: auteurPrenom,
        userEmail: sessionEmailTrimmed,
        type,
        titre,
        message,
        page,
        niveau,
        joinContext,
        href: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        screenWidth: typeof screen !== "undefined" ? screen.width : 0,
        screenHeight: typeof screen !== "undefined" ? screen.height : 0,
      });
      requestKanbanReload();
      setSent(true);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Envoi impossible. Vérifiez votre connexion Grist puis réessayez.";
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  const canSubmit =
    titre.trim().length > 0 &&
    hasSessionEmail &&
    auteurPrenom.length > 0 &&
    !sending;

  return (
    <>
      {open ? (
        <div
          className={styles.panel}
          role="dialog"
          aria-modal="false"
          aria-label="Donner un retour"
        >
          <div className={styles.header}>
            <div>
              <h2 className={`${styles.title} fr-mb-0`}>Un retour à partager&nbsp;?</h2>
              <p className={`fr-text--sm ${styles.subtitle}`}>
                Anomalie, idée ou question — l&apos;équipe studio lit tout.
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Fermer"
              onClick={close}
            >
              <CloseIcon />
            </button>
          </div>

          {sent ? (
            <div className={styles.confirm}>
              <div className={styles.confirmBadge}>
                <CheckIcon />
              </div>
              <h2 className={`${styles.title} fr-mb-1w`}>Merci, c&apos;est enregistré&nbsp;!</h2>
              <p className="fr-text--sm" style={{ color: "var(--text-mention-grey)" }}>
                Votre retour arrive dans le suivi de l&apos;équipe studio. Vous pourrez le
                retrouver dans «&nbsp;Vos retours&nbsp;» sur l&apos;accueil.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className="fr-btn fr-btn--secondary fr-btn--sm"
                  onClick={close}
                >
                  Fermer
                </button>
                <button type="button" className="fr-btn fr-btn--sm" onClick={resetForm}>
                  Un autre retour
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.body}>
              {!hasSessionEmail ? (
                <p className={`fr-text--sm ${styles.error}`} role="alert">
                  {NO_EMAIL_MESSAGE}
                </p>
              ) : null}

              <fieldset className={styles.fieldset}>
                <legend className={`fr-label fr-mb-1w ${styles.legend}`}>Type de retour</legend>
                <div className={styles.typeGrid}>
                  {TYPES.map((t) => {
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.typeBtn}${active ? ` ${styles.typeBtnActive}` : ""}`}
                        aria-pressed={active}
                        onClick={() => setType(t)}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="fr-input-group fr-mb-2w">
                <label className="fr-label" htmlFor={titreId}>
                  Titre <span className={styles.required}>*</span>
                  <span className="fr-hint-text">
                    Ce qui compte — titre et résumé de la carte kanban (max&nbsp;{FEEDBACK_TITRE_MAX}).
                  </span>
                </label>
                <input
                  className="fr-input"
                  id={titreId}
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex. Je ne peux pas valider mon CRA du mois — bouton Enregistrer grisé"
                  maxLength={FEEDBACK_TITRE_MAX}
                  required
                />
              </div>

              <div className="fr-input-group fr-mb-2w">
                <label className="fr-label" htmlFor={msgId}>
                  Détail <span className="fr-hint-text">(optionnel)</span>
                  <span className="fr-hint-text">{HINTS[type]}</span>
                </label>
                <textarea
                  className="fr-input"
                  id={msgId}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Étapes, captures, contexte utile…"
                  style={{ resize: "vertical" }}
                />
              </div>

              {type === "Anomalie" ? (
                <div className="fr-select-group fr-mb-2w">
                  <label className="fr-label" htmlFor={niveauId}>
                    Niveau de gêne
                  </label>
                  <select
                    className="fr-select"
                    id={niveauId}
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value)}
                  >
                    {NIVEAUX.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="fr-checkbox-group fr-mb-2w">
                <input
                  type="checkbox"
                  id={ctxId}
                  checked={joinContext}
                  onChange={(e) => setJoinContext(e.target.checked)}
                />
                <label className="fr-label" htmlFor={ctxId}>
                  Joindre le contexte technique
                  <span className="fr-hint-text">
                    Page, navigateur et résolution — utile pour reproduire une anomalie.
                  </span>
                </label>
              </div>

              {hasSessionEmail && auteurPrenom ? (
                <p className={styles.identity} aria-live="polite">
                  <PersonIcon />
                  <span>
                    Signé avec votre compte Grist ·{" "}
                    <strong className={styles.identityName}>{auteurPrenom}</strong>
                  </span>
                </p>
              ) : null}

              {error ? (
                <p className={`fr-text--sm ${styles.error}`} role="alert">
                  {error}
                </p>
              ) : null}

              <div className={styles.actions}>
                <button
                  type="button"
                  className="fr-btn fr-btn--secondary"
                  onClick={close}
                  disabled={sending}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="fr-btn"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                >
                  {sending ? "Envoi…" : "Envoyer le retour"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-label="Donner un retour"
        onClick={() => setOpen((v) => !v)}
      >
        <ChatIcon />
        <span>Un retour&nbsp;?</span>
      </button>
    </>
  );
}
