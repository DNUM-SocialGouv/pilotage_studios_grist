/** Ouvre le panneau « Un retour ? » / recharge le kanban d’accueil. */

const OPEN_FEEDBACK_EVENT = "pilotage:open-feedback";
const KANBAN_RELOAD_EVENT = "pilotage:kanban-reload";

export function requestOpenFeedback(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT));
}

export function subscribeOpenFeedback(handler: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const listener = () => handler();
  window.addEventListener(OPEN_FEEDBACK_EVENT, listener);
  return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, listener);
}

/** Après create Feedback réussi — rafraîchir la feuille de route. */
export function requestKanbanReload(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(KANBAN_RELOAD_EVENT));
}

export function subscribeKanbanReload(handler: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const listener = () => handler();
  window.addEventListener(KANBAN_RELOAD_EVENT, listener);
  return () => window.removeEventListener(KANBAN_RELOAD_EVENT, listener);
}
