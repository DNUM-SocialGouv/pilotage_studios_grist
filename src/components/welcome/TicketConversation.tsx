import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useAclProfil } from "../../AclProfilContext";
import { recordsFromFetchTable } from "../../gristMap";
import { fetchAllowlistedTable } from "../../security/fetchTableAllowlist";
import { createKanbanCommentaire } from "../../utils/createKanbanCommentaire";
import {
  filterCommentairesForTicket,
  kanbanCommentaireFromRecord,
  type KanbanCommentaireItem,
} from "../../utils/kanbanCommentaires";
import { prenomFromAuteur } from "../../utils/kanbanTickets";
import { defaultWeeklyAuteurPrenom } from "../../utils/weeklyAgenda";
import { MissionProse } from "../missions/MissionProse";

type TicketConversationProps = {
  cibleId: number;
  /**
   * Lien interne Markdown (path `/…`) — ex. fermer le drawer ticket
   * avant navigation MemoryRouter.
   */
  onInternalLinkClick?: (path: string) => void;
};

const NO_EMAIL_MESSAGE =
  "Impossible d’identifier votre compte Grist (pas d’e-mail de session). Réessayez depuis le document Pilotage, ou contactez un Admin si le problème continue.";

/**
 * Fil de commentaires d’un ticket kanban + formulaire d’envoi (tout utilisateur).
 * Signature = e-mail de session (comme feedback / sujets Weekly) — pas de select « Vous êtes ».
 * Lecture : Markdown léger rendu (`MissionProse`). Saisie : textarea Markdown inchangé.
 */
export function TicketConversation({
  cibleId,
  onInternalLinkClick,
}: TicketConversationProps) {
  const msgId = useId();
  const { email: sessionEmail, displayName } = useAclProfil();
  const [comments, setComments] = useState<KanbanCommentaireItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sessionEmailTrimmed = (sessionEmail ?? "").trim();
  const hasSessionEmail = sessionEmailTrimmed.length > 0;
  const auteurPrenom = defaultWeeklyAuteurPrenom(displayName, sessionEmail);

  const reload = useCallback(async () => {
    setLoadStatus("loading");
    setLoadError(null);
    try {
      const raw = await fetchAllowlistedTable("Kanban_commentaires");
      const rows = recordsFromFetchTable(raw);
      const all = rows
        .map((row) =>
          kanbanCommentaireFromRecord(row as Record<string, unknown> & { id: number }),
        )
        .filter((item): item is KanbanCommentaireItem => item != null);
      setComments(filterCommentairesForTicket(all, cibleId));
      setLoadStatus("ok");
    } catch (err) {
      setLoadStatus("error");
      setLoadError(err instanceof Error ? err.message : String(err));
      setComments([]);
    }
  }, [cibleId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const canSubmit =
    message.trim().length > 0 &&
    hasSessionEmail &&
    auteurPrenom.length > 0 &&
    !submitting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createKanbanCommentaire({
        cibleId,
        userName: auteurPrenom,
        userEmail: sessionEmailTrimmed,
        message,
      });
      setMessage("");
      await reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const countLabel =
    loadStatus === "ok"
      ? comments.length === 0
        ? "0 message"
        : comments.length === 1
          ? "1 message"
          : `${comments.length} messages`
      : null;

  return (
    <section className="ticket-conversation" aria-labelledby="ticket-conversation-title">
      <div className="ticket-conversation__head">
        <h3 id="ticket-conversation-title" className="fr-text--md fr-mb-0">
          Conversation
        </h3>
        {countLabel ? (
          <p className="fr-text--xs fr-hint-text fr-mb-0">{countLabel}</p>
        ) : null}
      </div>

      {loadStatus === "loading" ? (
        <p className="fr-text--sm fr-hint-text" role="status">
          Chargement des commentaires…
        </p>
      ) : null}
      {loadStatus === "error" ? (
        <Alert
          severity="error"
          small
          title="Commentaires indisponibles"
          description={loadError ?? "Impossible de charger les commentaires."}
        />
      ) : null}
      {loadStatus === "ok" && comments.length === 0 ? (
        <p className="fr-text--sm fr-hint-text">
          Aucun commentaire pour l’instant. Posez une question ou notez une décision
          ici.
        </p>
      ) : null}
      {comments.length > 0 ? (
        <ul className="ticket-conversation__list fr-mb-3w">
          {comments.map((c) => (
            <li key={c.id} className="ticket-conversation__item">
              <p className="fr-text--xs fr-hint-text fr-mb-1v">
                <strong className="fr-text--bold">{prenomFromAuteur(c.auteur)}</strong>
                {c.dateLabel ? ` · ${c.dateLabel}` : ""}
              </p>
              <div className="ticket-conversation__body">
                <MissionProse
                  value={c.message}
                  onInternalLinkClick={onInternalLinkClick}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="ticket-conversation__form" onSubmit={(e) => void onSubmit(e)}>
        {!hasSessionEmail ? (
          <Alert
            className="fr-mb-2w"
            severity="warning"
            small
            title="Signature indisponible"
            description={NO_EMAIL_MESSAGE}
          />
        ) : null}
        <div className="fr-input-group fr-mb-2w">
          <label className="fr-label" htmlFor={msgId}>
            Votre commentaire
            <span className="fr-hint-text">
              {
                "Markdown léger (titres, listes, liens http(s) ou page interne, code `…` ou ```). Ex. [Documentation](/outils/regles-metier)."
              }
            </span>
          </label>
          <textarea
            className="fr-input"
            id={msgId}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrire un commentaire…"
            style={{ resize: "vertical" }}
            required
            disabled={!hasSessionEmail}
          />
        </div>
        {hasSessionEmail && auteurPrenom ? (
          <p className="fr-text--xs fr-hint-text fr-mb-2w" aria-live="polite">
            Signé en tant que{" "}
            <strong className="fr-text--bold">{auteurPrenom}</strong>
            {" · compte Grist"}
          </p>
        ) : null}
        {submitError ? (
          <Alert
            className="fr-mb-2w"
            severity="error"
            small
            title="Envoi impossible"
            description={submitError}
          />
        ) : null}
        <div className="ticket-conversation__submit">
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </form>
    </section>
  );
}
