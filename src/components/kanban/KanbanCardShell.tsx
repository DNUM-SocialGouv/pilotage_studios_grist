/**
 * Carte kanban draggable + activation clavier + menu « Déplacer vers… ».
 * Contenu métier = children ; pas de logique Weekly / Missions ici.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { DsfrDropdownMenu, type DsfrDropdownMenuItem } from "../dsfr/DsfrDropdownMenu";

export type KanbanMoveTarget = {
  key: string;
  label: string;
};

export type KanbanCardShellProps = {
  cardId: string | number;
  busy?: boolean;
  draggable?: boolean;
  /** Nom accessible (remplace le contenu pour le lecteur d’écran). */
  ariaLabel: string;
  /** Clic / Enter / Espace — ex. ouvrir fiche ou drawer. */
  onActivate: () => void;
  onDragStart: (cardId: string | number) => void;
  onDragEnd: () => void;
  /** Colonnes cibles pour le menu clavier (hors colonne actuelle). */
  moveTargets?: readonly KanbanMoveTarget[];
  onMove?: (columnKey: string) => void;
  /** Items menu additionnels (fiche, modifier…). */
  menuItems?: readonly DsfrDropdownMenuItem[];
  menuLabel?: string;
  menuTitle?: string;
  children: ReactNode;
  className?: string;
};

export function KanbanCardShell({
  cardId,
  busy = false,
  draggable = true,
  ariaLabel,
  onActivate,
  onDragStart,
  onDragEnd,
  moveTargets = [],
  onMove,
  menuItems = [],
  menuLabel = "Actions",
  menuTitle,
  children,
  className,
}: KanbanCardShellProps) {
  const suppressClickRef = useRef(false);
  const canDrag = draggable && !busy;

  const moveMenuItems: DsfrDropdownMenuItem[] = moveTargets.map((t) => ({
    id: `move-${t.key}`,
    label: `Déplacer vers ${t.label}`,
    iconClassName: "fr-icon-arrow-right-line",
    onClick: () => onMove?.(t.key),
  }));

  const allMenuItems = [...menuItems, ...moveMenuItems];

  const activate = () => {
    if (busy) return;
    onActivate();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (busy) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };

  return (
    <article
      className={[
        "pilotage-kanban-card",
        canDrag || !busy ? "pilotage-kanban-card--interactive" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={canDrag}
      onDragStart={() => {
        suppressClickRef.current = true;
        onDragStart(cardId);
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        activate();
      }}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={busy || undefined}
    >
      {children}
      {allMenuItems.length > 0 ? (
        <div
          className="pilotage-kanban-card__menu"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DsfrDropdownMenu
            label={menuLabel}
            title={menuTitle}
            items={allMenuItems}
          />
        </div>
      ) : null}
    </article>
  );
}
