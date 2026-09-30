export const REPORT_STATUSES = ["DRAFT", "SUBMITTED", "AI_PROCESSING", "AI_DRAFT_READY", "PENDING_REVIEW", "RETURNED", "REJECTED", "APPROVED", "FINALIZED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type WorkflowAction = "SAVE_DRAFT" | "GENERATE" | "SUBMIT" | "RETURN" | "REJECT" | "APPROVE" | "FINALIZE";

const transitions: Record<WorkflowAction, readonly ReportStatus[]> = {
  SAVE_DRAFT: ["DRAFT", "RETURNED"], GENERATE: ["DRAFT", "RETURNED", "AI_DRAFT_READY"],
  SUBMIT: ["AI_DRAFT_READY", "RETURNED", "DRAFT"], RETURN: ["PENDING_REVIEW"],
  REJECT: ["PENDING_REVIEW"], APPROVE: ["PENDING_REVIEW"], FINALIZE: ["APPROVED"],
};
export function canTransition(status: ReportStatus, action: WorkflowAction) { return transitions[action].includes(status); }
export function nextStatus(action: WorkflowAction): ReportStatus {
  return ({ SAVE_DRAFT:"DRAFT", GENERATE:"AI_DRAFT_READY", SUBMIT:"PENDING_REVIEW", RETURN:"RETURNED", REJECT:"REJECTED", APPROVE:"APPROVED", FINALIZE:"FINALIZED" } as const)[action];
}
export function requiresComment(action: WorkflowAction) { return action === "RETURN" || action === "REJECT"; }
