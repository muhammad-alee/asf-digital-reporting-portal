import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { airports, auditLogs, formFields, reportMessages, reportTemplates, reportTypes, reportVersions, reports } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";
import { canViewReport } from "@/lib/reports/scope";
import { validateReport } from "@/lib/reports/validation";
import { canTransition, nextStatus, type ReportStatus } from "@/lib/reports/workflow";
import { AIReportResultSchema, generateDeterministicReport } from "@/lib/ai/report-service";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:create");
    const { id } = await context.params;
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!report || !canViewReport(actor, report)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    if (!canTransition(report.status as ReportStatus, "GENERATE")) {
      return NextResponse.json({ error: "This report cannot be generated in its current status." }, { status: 409 });
    }

    const [[reportType], [airport], template, messages, fields] = await Promise.all([
      db.select().from(reportTypes).where(eq(reportTypes.id, report.reportTypeId)).limit(1),
      db.select().from(airports).where(eq(airports.id, report.airportId)).limit(1),
      db.select().from(reportTemplates).where(and(eq(reportTemplates.reportTypeId, report.reportTypeId), eq(reportTemplates.status, "active"))).orderBy(desc(reportTemplates.version)).limit(1),
      db.select().from(reportMessages).where(eq(reportMessages.reportId, id)).orderBy(desc(reportMessages.createdAt)),
      db.select().from(formFields).where(eq(formFields.reportTypeId, report.reportTypeId)),
    ]);
    if (!reportType || !airport) return NextResponse.json({ error: "Report type or airport is missing." }, { status: 500 });
    const activeTemplate = template[0];
    if (!activeTemplate) return NextResponse.json({ error: "No active template is configured for this report type." }, { status: 422 });

    const source = messages.map(m => m.sourceText).join("\n");
    const structuredData = (report.structuredData ?? {}) as Record<string, unknown>;
    const validation = validateReport({ source, requiredFields: activeTemplate.requiredFields as string[], data: structuredData });
    const fieldLabels = Object.fromEntries(fields.map(f => [f.fieldKey, f.label]));

    const result = generateDeterministicReport({
      reportTypeName: reportType.name,
      airportName: airport.name,
      reportDate: report.reportDate,
      subjectPattern: activeTemplate.subjectPattern,
      templateBody: activeTemplate.templateBody,
      structuredData,
      fieldLabels,
      sourceText: source,
      missingFields: validation.missingFields,
      contradictions: validation.contradictions,
      warnings: validation.warnings,
    });
    AIReportResultSchema.parse(result);

    const now = new Date();
    const status = nextStatus("GENERATE");
    await db.batch([
      db.update(reports).set({ status, generatedContent: result.generated_report, aiAnalysis: result, templateId: activeTemplate.id, updatedAt: now }).where(eq(reports.id, id)),
      db.insert(reportVersions).values({ id: crypto.randomUUID(), reportId: id, versionNumber: now.getTime(), content: result.generated_report, structuredData, changedBy: actor.id, changeType: "AI_GENERATE", createdAt: now }),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report", entityId: id, action: "ai_generated", metadata: { missingFields: result.missing_fields, contradictions: result.contradictions }, createdAt: now }),
    ]);
    return NextResponse.json({ id, status, result });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to generate report." }, { status: 500 });
  }
}
