import type { MouseEvent, RefObject } from "react";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import type { VosRetoursStatus } from "../../hooks/useVosRetours";
import { requestOpenFeedback } from "../../utils/feedbackOpen";
import { badgeClassForKanbanColumn, type KanbanTicket } from "../../utils/kanbanTickets";
import type { VosRetourItem, VosRetoursTabId } from "../../utils/vosRetours";

export type VosRetoursSectionProps = {
  status: VosRetoursStatus;
  actifs: VosRetourItem[];
  archives: VosRetourItem[];
  /** Feedback auteur (avant slice) — empty E1 vs E2. */
  mineCount: number;
  error: string | null;
  onOpenTicket: (ticket: KanbanTicket) => void;
  /** Refs des boutons liste — restauration focus après fermeture drawer. */
  itemButtonRefs: RefObject<Map<number, HTMLButtonElement>>;
  /** Cible focus si la carte quitte l’onglet Actifs après lecture (Livré → Archivés). */
  sectionTitleRef?: RefObject<HTMLHeadingElement | null>;
};

function truncateTitle(title: string, max = 72): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function RetoursList({
  items,
  onOpenTicket,
  itemButtonRefs,
}: {
  items: VosRetourItem[];
  onOpenTicket: (ticket: KanbanTicket) => void;
  itemButtonRefs: RefObject<Map<number, HTMLButtonElement>>;
}) {
  return (
    <ul className="welcome-vos-retours__list fr-mb-0">
      {items.map((item) => (
        <li key={item.ticket.id} className="welcome-vos-retours__item">
          <button
            type="button"
            className="welcome-vos-retours__item-btn"
            ref={(el) => {
              const map = itemButtonRefs.current;
              if (!map) return;
              if (el) map.set(item.ticket.id, el);
              else map.delete(item.ticket.id);
            }}
            onClick={() => onOpenTicket(item.ticket)}
          >
            {item.noveltyLabel ? (
              <span
                className={
                  item.novelty === "nouvelle_reponse"
                    ? "welcome-vos-retours__novelty welcome-vos-retours__novelty--reply"
                    : "welcome-vos-retours__novelty welcome-vos-retours__novelty--updated"
                }
              >
                {item.noveltyLabel}
              </span>
            ) : null}
            <span className="welcome-vos-retours__item-title">
              {truncateTitle(item.ticket.title)}
            </span>
            <span className="welcome-vos-retours__item-meta fr-text--sm fr-hint-text">
              <Badge
                small
                as="span"
                className={badgeClassForKanbanColumn(item.ticket.column)}
              >
                {item.columnLabel}
              </Badge>
              {item.relativeDate ? (
                <span aria-hidden="true"> · </span>
              ) : null}
              {item.relativeDate ? <span>{item.relativeDate}</span> : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Bloc « Vos retours » — onglets Actifs / Archivés (Option C) + liste compacte.
 */
export function VosRetoursSection({
  status,
  actifs,
  archives,
  mineCount,
  error,
  onOpenTicket,
  itemButtonRefs,
  sectionTitleRef,
}: VosRetoursSectionProps) {
  const navigate = useNavigate();
  const tabsName = useId();
  const panelId = useId();
  const [tab, setTab] = useState<VosRetoursTabId>("actifs");

  const items = tab === "actifs" ? actifs : archives;
  const count =
    status === "loading" || status === "error" || status === "standalone"
      ? 0
      : items.length;

  const goFeuilleDeRoute = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/feuille-de-route");
  };

  const showFilter =
    status === "ok" || status === "empty";
  const emptyNoFeedback = status === "empty" || (status === "ok" && mineCount === 0);
  const emptyActifsAllArchived =
    status === "ok" && mineCount > 0 && tab === "actifs" && actifs.length === 0;
  const emptyArchives =
    status === "ok" && tab === "archives" && archives.length === 0;

  return (
    <section
      className="welcome-vos-retours"
      aria-labelledby="vos-retours-title"
    >
      <div className="welcome-vos-retours__head">
        <h2
          id="vos-retours-title"
          ref={sectionTitleRef}
          className="fr-h5 welcome-vos-retours__title"
          tabIndex={-1}
        >
          Vos retours
        </h2>
        <Badge
          small
          as="span"
          aria-label={
            tab === "actifs"
              ? `Actifs : ${count} carte${count === 1 ? "" : "s"}`
              : `Archivés : ${count} carte${count === 1 ? "" : "s"}`
          }
        >
          {status === "loading" ? "…" : count}
        </Badge>
      </div>

      {status === "loading" ? (
        <p className="fr-text--sm fr-hint-text fr-mb-0" role="status">
          Chargement de vos retours…
        </p>
      ) : null}

      {status === "error" ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Retours indisponibles"
          description={
            error
              ? `Impossible de charger vos retours (${error}). Consultez la feuille de route.`
              : "Impossible de charger vos retours. Consultez la feuille de route."
          }
        />
      ) : null}

      {status === "standalone" ? (
        <p className="fr-text--sm fr-hint-text fr-mb-2w">
          Vos retours sont disponibles dans le widget Grist.
        </p>
      ) : null}

      {showFilter && !emptyNoFeedback ? (
        <div className="welcome-vos-retours__tabs fr-mb-2w">
          <SegmentedControl
            legend="Filtrer vos retours"
            name={tabsName}
            inlineLegend
            small
            segments={[
              {
                label: `Actifs (${actifs.length})`,
                nativeInputProps: {
                  value: "actifs",
                  checked: tab === "actifs",
                  onChange: () => setTab("actifs"),
                  "aria-controls": panelId,
                },
              },
              {
                label: `Archivés (${archives.length})`,
                nativeInputProps: {
                  value: "archives",
                  checked: tab === "archives",
                  onChange: () => setTab("archives"),
                  "aria-controls": panelId,
                },
              },
            ]}
          />
        </div>
      ) : null}

      {emptyNoFeedback ? (
        <div className="welcome-vos-retours__empty">
          <p className="fr-mb-1w">
            Aucun retour de votre part pour l’instant.
          </p>
          <p className="fr-text--sm fr-hint-text fr-mb-2w">
            Bug, idée ou question — dites-le à l’équipe.
          </p>
          <Button
            priority="secondary"
            size="small"
            type="button"
            iconId="fr-icon-chat-3-line"
            onClick={() => requestOpenFeedback()}
          >
            Un retour&nbsp;?
          </Button>
        </div>
      ) : null}

      {emptyActifsAllArchived ? (
        <div className="welcome-vos-retours__empty" id={panelId} role="status">
          <p className="fr-mb-1w">
            Tous vos retours livrés ont été consultés.
          </p>
          <p className="fr-text--sm fr-hint-text fr-mb-0">
            Retrouvez-les dans l’onglet Archivés ou sur la feuille de route.
          </p>
        </div>
      ) : null}

      {emptyArchives ? (
        <div className="welcome-vos-retours__empty" id={panelId} role="status">
          <p className="fr-mb-0">
            Aucun retour archivé pour l’instant.
          </p>
          <p className="fr-text--sm fr-hint-text fr-mt-1w fr-mb-0">
            Les retours passés en Livré et déjà ouverts apparaissent ici.
          </p>
        </div>
      ) : null}

      {items.length > 0 && !emptyNoFeedback ? (
        <div id={panelId} role="region" aria-live="polite">
          <RetoursList
            items={items}
            onOpenTicket={onOpenTicket}
            itemButtonRefs={itemButtonRefs}
          />
        </div>
      ) : null}

      <div className="welcome-vos-retours__footer fr-mt-2w">
        <Button
          priority="tertiary"
          size="small"
          linkProps={{
            href: "/feuille-de-route",
            onClick: goFeuilleDeRoute,
          }}
        >
          Voir la feuille de route
        </Button>
      </div>
    </section>
  );
}
