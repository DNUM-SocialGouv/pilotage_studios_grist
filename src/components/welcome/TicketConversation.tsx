import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti";
import { recordsFromFetchTable } from "../../gristMap";
import { fetchAllowlistedTable } from "../../security/fetchTableAllowlist";
import { createKanbanCommentaire } from "../../utils/createKanbanCommentaire";
import {
  feedbackAuteurOptionsFromEquipeTable,
  type FeedbackAuteurOption,
} from "../../utils/feedbackEquipe";
import {
  filterCommentairesForTicket,
  kanbanCommentaireFromRecord,
  type KanbanCommentaireItem,
} from "../../utils/kanbanCommentaires";
import { prenomFromAuteur } from "../../utils/kanbanTickets";

type TicketConversationProps = {
  cibleId: number;
};

/**
 * Fil de commentaires d’un ticket kanban + formulaire d’envoi (tout utilisateur).
 */
export function TicketConversation({ cibleId }: TicketConversationProps) {
  const auteurSelectId = useId();
  const msgId = useId();
  const [comments, setComments] = useState<KanbanCommentaireItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auteurOptions, setAuteurOptions] = useState<FeedbackAuteurOption[]>([]);
  const [auteursLoading, setAuteursLoading] = useState(true);
  const [auteursError, setAuteursError] = useState<string | null>(null);
  const [auteurId, setAuteurId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const loadAuteurs = async () => {
      setAuteursLoading(true);
      setAuteursError(null);
      try {
        const raw = await fetchAllowlistedTable("Equipe");
        if (cancelled) {
          return;
        }
        setAuteurOptions(feedbackAuteurOptionsFromEquipeTable(raw));
      } catch (err) {
        if (cancelled) {
          return;
        }
        setAuteursError(err instanceof Error ? err.message : String(err));
        setAuteurOptions([]);
      } finally {
        if (!cancelled) {
          setAuteursLoading(false);
        }
      }
    };
    void loadAuteurs();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAuteur = auteurOptions.find((o) => o.value === auteurId);
  const canSubmit =
    message.trim().length > 0 && Boolean(selectedAuteur) && !submitting;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAuteur || !canSubmit) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createKanbanCommentaire({
        cibleId,
        userName: selectedAuteur.name,
        userEmail: selectedAuteur.email,
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
              <p className="fr-text--sm fr-mb-0" style={{ whiteSpace: "pre-wrap" }}>
                {c.message}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="ticket-conversation__form" onSubmit={(e) => void onSubmit(e)}>
        <div className="ticket-conversation__identity fr-mb-2w">
          <DsfrSelectRichMulti
            id={auteurSelectId}
            label="Vous êtes"
            hintText={
              auteursLoading
                ? "Chargement de la table Equipe…"
                : "Choisissez votre nom dans la table Équipe (déclaratif)."
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
            <p className="fr-text--xs fr-error-text" role="alert">
              {auteursError}
            </p>
          ) : null}
        </div>
        <div className="fr-input-group fr-mb-2w">
          <label className="fr-label" htmlFor={msgId}>
            Votre commentaire
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
          />
        </div>
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
