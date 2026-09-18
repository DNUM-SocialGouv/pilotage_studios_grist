/** Ouvre le panneau « Un retour ? » depuis l’empty state Feedback. */

const OPEN_FEEDBACK_EVENT = "pilotage:open-feedback";

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
