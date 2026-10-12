/**
 * Liste des actions Weekly liées à une mission ou un sujet.
 * Réutilisée dans le drawer suivi mission et le drawer sujet.
 *
 * Un seul CTA « Lier une action » : dans l’en-tête s’il y a déjà des liens,
 * sinon sous l’état vide (évite le doublon header + bouton).
 */

import { Button } from "@codegouvfr/react-dsfr/Button";
import type { WeeklyActionRow } from "../../types";
import { weeklyActionStatutLabel } from "../../utils/weeklyAction";

export type WeeklyLinkedActionsSectionProps = {
  /** Identifiant stable pour titres / aria (ex. id du drawer). */
  titleId: string;
  actions: readonly WeeklyActionRow[];
  /** Texte d’aide sous le titre. */
  hint: string;
  /** Message d’état vide. */
  emptyLabel?: string;
  locked?: boolean;
  onLier?: () => void;
  onViewAction?: (action: WeeklyActionRow) => void;
};

export function WeeklyLinkedActionsSection({
  titleId,
  actions,
  hint,
  emptyLabel = "Aucune action liée pour l’instant.",
  locked = false,
  onLier,
  onViewAction,
}: WeeklyLinkedActionsSectionProps) {
  const headingId = `${titleId}-actions-liees`;
  const hasActions = actions.length > 0;

  return (
    <section
      className="fr-mt-3w"
      aria-labelledby={headingId}
      style={{
        paddingTop: "1rem",
        borderTop: "1px solid var(--border-default-grey)",
      }}
    >
      <div
        className="fr-mb-1w"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 id={headingId} className="fr-h6 fr-mb-0">
          Actions liées
          {hasActions ? (
            <span className="fr-hint-text" style={{ fontWeight: 400 }}>
              {" "}
              ({actions.length})
            </span>
          ) : null}
        </h3>
        {onLier && hasActions ? (
          <Button
            type="button"
            priority="tertiary no outline"
            size="small"
            iconId="fr-icon-links-line"
            disabled={locked}
            onClick={onLier}
          >
            Lier une action
          </Button>
        ) : null}
      </div>
      <p className="fr-hint-text fr-mb-2w">{hint}</p>
      {!hasActions ? (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--background-alt-grey)",
            boxShadow: "inset 0 0 0 1px var(--border-default-grey)",
          }}
        >
          <p
            className="fr-text--sm fr-mb-2w"
            style={{ color: "var(--text-mention-grey)", marginTop: 0 }}
          >
            {emptyLabel}
          </p>
          {onLier ? (
            <Button
              type="button"
              priority="secondary"
              size="small"
              iconId="fr-icon-links-line"
              disabled={locked}
              onClick={onLier}
            >
              Lier une action
            </Button>
          ) : null}
        </div>
      ) : (
        <ul
          className="fr-raw-list"
          style={{
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {actions.map((action) => {
            const titre = (action.Titre ?? "Action").trim() || "Action";
            const fait = action.Fait === true;
            const statut = fait
              ? "Fait"
              : weeklyActionStatutLabel(action.Statut);
            return (
              <li
                key={action.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem 0.75rem",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderTop: "1px solid var(--border-default-grey)",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 8rem" }}>
                  {onViewAction ? (
                    <button
                      type="button"
                      className="fr-link fr-link--sm"
                      disabled={locked}
                      onClick={() => onViewAction(action)}
                      style={{
                        textAlign: "left",
                        fontWeight: 500,
                        textDecoration: fait ? "line-through" : undefined,
                      }}
                    >
                      {titre}
                    </button>
                  ) : (
                    <p
                      className="fr-text--sm fr-mb-0"
                      style={{
                        fontWeight: 500,
                        textDecoration: fait ? "line-through" : undefined,
                      }}
                    >
                      {titre}
                    </p>
                  )}
                  <p
                    className="fr-text--xs fr-mb-0"
                    style={{ color: "var(--text-mention-grey)" }}
                  >
                    {statut}
                  </p>
                </div>
                {onViewAction ? (
                  <Button
                    type="button"
                    priority="tertiary no outline"
                    size="small"
                    iconId="fr-icon-eye-line"
                    disabled={locked}
                    onClick={() => onViewAction(action)}
                    title="Voir"
                    nativeButtonProps={{
                      "aria-label": "Voir",
                    }}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
