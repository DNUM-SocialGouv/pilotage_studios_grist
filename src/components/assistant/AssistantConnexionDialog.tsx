/**
 * Modale « Connexion Assistant » — ouverte depuis le menu compte (ou le rappel chat).
 * URL Onyxia + jeton partagé (sessionStorage), hors panneau de chat.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  fetchAssistantHealth,
  AssistantAskError,
} from "../../utils/assistantAsk.ts";
import {
  isAssistantConfigReady,
  loadAssistantConfig,
  saveAssistantConfig,
} from "../../utils/assistantConfig.ts";
import styles from "./AssistantConnexionDialog.module.css";

export type AssistantConnexionDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AssistantConnexionDialog({
  open,
  onClose,
}: AssistantConnexionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const urlId = useId();
  const secretId = useId();

  const [draftUrl, setDraftUrl] = useState("");
  const [draftSecret, setDraftSecret] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthHint, setHealthHint] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      const current = loadAssistantConfig();
      setDraftUrl(current.baseUrl);
      setDraftSecret(current.sharedSecret);
      setError(null);
      setHealthHint(null);
      setSavedHint(null);
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        document.getElementById(urlId)?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, urlId]);

  function persist() {
    const next = saveAssistantConfig({
      baseUrl: draftUrl,
      sharedSecret: draftSecret,
    });
    setDraftUrl(next.baseUrl);
    setDraftSecret(next.sharedSecret);
    setError(null);
    setSavedHint(
      isAssistantConfigReady(next)
        ? "Connexion enregistrée pour cet onglet."
        : "URL enregistrée — indiquez aussi le jeton si le service l’exige.",
    );
    return next;
  }

  async function checkHealth() {
    const next = persist();
    setChecking(true);
    setError(null);
    setHealthHint(null);
    setSavedHint(null);
    try {
      const health = await fetchAssistantHealth(next);
      if (health.ok) {
        const model = health.model ? ` · modèle ${health.model}` : "";
        const litellm =
          health.litellmConfigured === false ? " · LiteLLM non configuré" : "";
        const runtime = health.runtime ? ` · ${health.runtime}` : "";
        const parc =
          health.parcConfigured === true
            ? " · PARC prêt"
            : health.parcConfigured === false
              ? " · PARC non configuré (GRIST_* ou runtime Node)"
              : "";
        setHealthHint(`Service joignable${runtime}${model}${litellm}${parc}.`);
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

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-confirm-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="pilotage-confirm-dialog__panel fr-p-3w">
        <h2 id={titleId} className="fr-h5 fr-mb-1w">
          Connexion Assistant
        </h2>
        <p className={`fr-text--sm fr-mb-3w ${styles.intro}`}>
          Essai : URL du service Onyxia (port 5000) et jeton partagé. Stockés seulement
          dans cet onglet — pas dans Grist.
        </p>

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

        <div className="fr-input-group fr-mb-3w">
          <label className="fr-label" htmlFor={secretId}>
            Jeton partagé (Bearer)
            <span className="fr-hint-text">
              Même valeur que ASSISTANT_SHARED_SECRET côté serveur.
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

        {error ? (
          <p className={`fr-text--sm ${styles.error}`} role="alert">
            {error}
          </p>
        ) : null}
        {healthHint ? (
          <p className={`fr-text--sm ${styles.ok}`} role="status">
            {healthHint}
          </p>
        ) : null}
        {savedHint ? (
          <p className={`fr-text--sm ${styles.saved}`} role="status">
            {savedHint}
          </p>
        ) : null}

        <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
          <li>
            <Button type="button" onClick={() => persist()}>
              Enregistrer
            </Button>
          </li>
          <li>
            <Button
              type="button"
              priority="secondary"
              onClick={() => void checkHealth()}
              disabled={checking || draftUrl.trim().length === 0}
            >
              {checking ? "Test…" : "Tester la connexion"}
            </Button>
          </li>
          <li>
            <Button type="button" priority="tertiary" onClick={onClose}>
              Fermer
            </Button>
          </li>
        </ul>
      </div>
    </dialog>
  );
}
