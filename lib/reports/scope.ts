import { and, eq, SQL } from "drizzle-orm";
import { reports } from "../../db/schema.ts";
import type { Role } from "@/lib/auth/permissions";
import type { ReportStatus } from "@/lib/reports/workflow";

export type Actor = { id: string; role: Role; airportId: string | null };

/** ADMIN and AUDITOR are not bound to a single airport's records. */
export function canViewAllAirports(role: Role) {
  return role === "ADMIN" || role === "AUDITOR";
}

/** Roles that can see a review queue at all (vs. only their own submissions). */
export function canReviewQueue(role: Role) {
  return role === "SUPERVISOR" || role === "REPORT_OFFICER" || role === "COMMANDER" || canViewAllAirports(role);
}

/**
 * Builds the Drizzle `where` condition for GET /api/reports.
 * - DATA_ENTRY (and any role without queue access): only their own reports.
 * - Reviewer roles: reports in their own airport, optionally narrowed by status.
 * - ADMIN/AUDITOR: every report, optionally narrowed by status.
 */
export function buildReportsFilter(actor: Actor, params: { status?: ReportStatus | null }): SQL | undefined {
  const statusClause = params.status ? eq(reports.status, params.status) : undefined;

  if (!canReviewQueue(actor.role)) {
    return and(eq(reports.submittedBy, actor.id), statusClause);
  }
  if (canViewAllAirports(actor.role)) {
    return statusClause;
  }
  const scope = actor.airportId ? eq(reports.airportId, actor.airportId) : eq(reports.submittedBy, actor.id);
  return and(scope, statusClause);
}

/** Whether `actor` may read a single report already known to belong to `airportId`/`submittedBy`. */
export function canViewReport(actor: Actor, report: { airportId: string; submittedBy: string | null }) {
  if (canViewAllAirports(actor.role)) return true;
  if (report.submittedBy === actor.id) return true;
  return canReviewQueue(actor.role) && actor.airportId === report.airportId;
}
