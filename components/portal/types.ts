import type { reports, airports, units } from "@/db/schema";
import type { Role } from "@/lib/auth/permissions";
import type { ReportTypeWithFields } from "@/lib/reports/report-types";
import type { ReportStatus } from "@/lib/reports/workflow";
import type { AIReportResult } from "@/lib/ai/report-service";

export type Report = typeof reports.$inferSelect;
export type Airport = typeof airports.$inferSelect;
export type Unit = typeof units.$inferSelect;

export type Actor = { displayName: string; role: Role; airportId: string | null };

export type ValidationResult = { missingFields: string[]; contradictions: string[]; warnings: string[] };

export type { ReportTypeWithFields, ReportStatus, AIReportResult };
