/**
 * @deprecated Preferer `createKanbanFeedback` — alias de compat pour les imports existants.
 */
export {
  buildKanbanFeedbackFields as buildRetoursFields,
  createKanbanFeedbackRecord as createRetoursRecord,
  resumeFromMessage,
  type CreateKanbanFeedbackInput as CreateRetoursInput,
  type FeedbackType,
  type KanbanFeedbackFields as RetoursFields,
} from "./createKanbanFeedback.ts";
