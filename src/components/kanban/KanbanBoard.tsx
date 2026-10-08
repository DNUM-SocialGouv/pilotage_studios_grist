/**
 * Shell kanban commun (colonnes + zone de drop) — Weekly Ops et Missions.
 * Pas de couplage de données : chaque écran fournit colonnes / cartes / onDrop.
 */
import type { DragEvent, ReactNode } from "react";

export type KanbanColumnMeta = {
  key: string;
  label: string;
  count: number;
  dot: string;
  colBg: string;
};

export type KanbanBoardProps = {
  ariaLabel: string;
  columns: readonly KanbanColumnMeta[];
  onDropColumn: (columnKey: string, event: DragEvent) => void;
  renderCards: (columnKey: string) => ReactNode;
  hint?: ReactNode;
  statusMessage?: string | null;
};

export function KanbanBoard({
  ariaLabel,
  columns,
  onDropColumn,
  renderCards,
  hint,
  statusMessage,
}: KanbanBoardProps) {
  return (
    <section aria-label={ariaLabel}>
      {hint ? <div className="pilotage-kanban__hint fr-mb-2w">{hint}</div> : null}
      {statusMessage ? (
        <p className="fr-sr-only" role="status">
          {statusMessage}
        </p>
      ) : null}
      <div className="pilotage-kanban__grid">
        {columns.map((col) => (
          <div
            key={col.key}
            className="pilotage-kanban__column"
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => onDropColumn(col.key, e)}
            style={{ background: col.colBg }}
          >
            <h3 className="pilotage-kanban__column-title fr-text--sm">
              <span
                aria-hidden="true"
                className="pilotage-kanban__column-dot"
                style={{ background: col.dot }}
              />
              <span>{col.label}</span>
              <span className="pilotage-kanban__column-count">({col.count})</span>
            </h3>
            <div className="pilotage-kanban__column-body">{renderCards(col.key)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
