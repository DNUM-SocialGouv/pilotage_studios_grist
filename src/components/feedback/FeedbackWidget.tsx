import { useEffect, useId, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti";
import { fetchAllowlistedTable } from "../../security/fetchTableAllowlist";
import {
  createRetoursRecord,
  type FeedbackType,
} from "../../utils/createRetoursRecord";
import {
  feedbackAuteurOptionsFromEquipeTable,
  type FeedbackAuteurOption,
} from "../../utils/feedbackEquipe";
import {
  FEEDBACK_PAGE_OPTIONS,
  pageOptionFromPathname,
  type FeedbackPageOption,
} from "../../utils/feedbackPages";
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

/**
 * Bouton flottant + panneau de feedback → écriture table Grist `Retours`.
 */
export function FeedbackWidget() {
  const location = useLocation();
  const baseId = useId();
  const pageSelectId = `${baseId}-page`;
  const msgId = `${baseId}-msg`;
  const niveauId = `${baseId}-niveau`;
  const ctxId = `${baseId}-ctx`;
  const auteurSelectId = `${baseId}-auteur`;

  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<FeedbackType>("Anomalie");
  const [page, setPage] = useState<FeedbackPageOption>(() =>
    pageOptionFromPathname(location.pathname),
  );
  const [message, setMessage] = useState("");
  const [niveau, setNiveau] = useState<string>(NIVEAUX[0]);
  const [joinContext, setJoinContext] = useState(true);
  const [auteurId, setAuteurId] = useState("");
  const [auteurOptions, setAuteurOptions] = useState<FeedbackAuteurOption[]>([]);
  const [auteursLoading, setAuteursLoading] = useState(false);
  const [auteursError, setAuteursError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || sent) {
      return;
    }
    setPage(pageOptionFromPathname(location.pathname));
  }, [location.pathname, open, sent]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setAuteursLoading(true);
    setAuteursError(null);
    void fetchAllowlistedTable("Equipe")
      .then((table) => {
        if (cancelled) {
          return;
        }
        setAuteurOptions(feedbackAuteurOptionsFromEquipeTable(table));
      })
      .catch(() => {
        if (!cancelled) {
          setAuteurOptions([]);
          setAuteursError("Impossible de charger la liste Equipe.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuteursLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedAuteur = useMemo(
    () => auteurOptions.find((o) => o.value === auteurId) ?? null,
    [auteurOptions, auteurId],
  );

  function close() {
    setOpen(false);
  }

  function resetForm() {
    setSent(false);
    setSending(false);
    setError(null);
    setMessage("");
    setType("Anomalie");
    setNiveau(NIVEAUX[0]);
    setJoinContext(true);
    setAuteurId("");
    setPage(pageOptionFromPathname(location.pathname));
  }

  async function submit() {
    if (message.trim().length === 0 || !selectedAuteur || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await createRetoursRecord({
        userName: selectedAuteur.name,
        userEmail: selectedAuteur.email,
        type,
        page,
        message,
        niveau,
        joinContext,
        href: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        screenWidth: typeof screen !== "undefined" ? screen.width : 0,
        screenHeight: typeof screen !== "undefined" ? screen.height : 0,
      });
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
    message.trim().length > 0 && selectedAuteur != null && !sending && !auteursLoading;

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
                Votre retour arrive dans le suivi de l&apos;équipe studio. Vous serez
                informé·e si une suite y est donnée.
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

              <div className="fr-mb-2w">
                <DsfrSelectRichMulti
                  id={auteurSelectId}
                  label="Votre identité"
                  hintText={
                    auteursLoading
                      ? "Chargement de la table Equipe…"
                      : "Choisissez votre nom dans la table Equipe (déclaratif)."
                  }
                  placeholderWhenEmpty="Rechercher une personne…"
                  options={auteurOptions}
                  selectedValues={auteurId ? [auteurId] : []}
                  onSelectedValuesChange={(values) => setAuteurId(values[0] ?? "")}
                  searchable
                  searchLabel="Rechercher"
                  searchPlaceholder="Nom ou e-mail…"
                  showBulkActions={false}
                  maxSelections={1}
                  pluralEntityLabel="personnes"
                  disabled={auteursLoading || auteurOptions.length === 0}
                />
                {auteursError ? (
                  <p className={`fr-text--xs ${styles.error}`} role="alert">
                    {auteursError}
                  </p>
                ) : null}
              </div>

              <div className="fr-select-group fr-mb-2w">
                <label className="fr-label" htmlFor={pageSelectId}>
                  Page concernée
                </label>
                <select
                  className="fr-select"
                  id={pageSelectId}
                  value={page}
                  onChange={(e) => setPage(e.target.value as FeedbackPageOption)}
                >
                  {FEEDBACK_PAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fr-input-group fr-mb-2w">
                <label className="fr-label" htmlFor={msgId}>
                  Votre message <span className={styles.required}>*</span>
                  <span className="fr-hint-text">{HINTS[type]}</span>
                </label>
                <textarea
                  className="fr-input"
                  id={msgId}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez le problème, l’idée ou la question…"
                  style={{ resize: "vertical" }}
                  required
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

              <div className="fr-checkbox-group fr-mb-3w">
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
