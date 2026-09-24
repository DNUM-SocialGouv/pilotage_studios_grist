/**
 * @deprecated Réexports — préférer `utils/kanbanTickets`.
 */
export {
  KANBAN_PRODUCT_COLUMNS as ROADMAP_KANBAN_COLUMNS,
  KANBAN_STATUS_BADGE_CLASS as ROADMAP_STATUS_BADGE_CLASS,
  KANBAN_STATUS_LABEL as ROADMAP_STATUS_LABEL,
  groupProductByKanban as groupRoadmapByKanban,
  kanbanTicketFromRecord as roadmapTicketFromRecord,
  parseKanbanColumn as parseRoadmapColonne,
  parseKanbanStatutProduit as parseRoadmapStatutProduit,
  type KanbanColumn as RoadmapKanbanColumn,
  type KanbanColumnId as RoadmapKanbanColumnId,
  type KanbanProductGroup as RoadmapKanbanGroup,
  type KanbanStatutProduit as RoadmapStatutProduit,
  type KanbanTicket as RoadmapTicket,
} from "../utils/kanbanTickets.ts";
