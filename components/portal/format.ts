import type { ReportStatus } from "./types";

const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  AI_PROCESSING: "AI processing",
  AI_DRAFT_READY: "AI draft ready",
  PENDING_REVIEW: "Pending review",
  RETURNED: "Returned",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  FINALIZED: "Finalized",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status as ReportStatus] ?? status;
}

export function statusSlug(status: string) {
  return statusLabel(status).toLowerCase().replaceAll(" ", "-");
}

export function formatDateTime(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
