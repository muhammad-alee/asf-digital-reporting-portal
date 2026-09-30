import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, reportMessages, reportReviews, reportVersions, reports } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";
import { canViewReport } from "@/lib/reports/scope";
import { validateReport } from "@/lib/reports/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:create");
    const { id } = await context.params;
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!report || !canViewReport(actor, report)) return NextResponse.json({ error: "Report not found." }, { status: 404 });

    const [messages, reviews] = await Promise.all([
      db.select().from(reportMessages).where(eq(reportMessages.reportId, id)).orderBy(desc(reportMessages.createdAt)),
      db.select().from(reportReviews).where(eq(reportReviews.reportId, id)).orderBy(desc(reportReviews.createdAt)),
    ]);
    return NextResponse.json({ report, messages, reviews });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:create");
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();
    const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (!report || !canViewReport(actor, report)) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    if (report.status !== "DRAFT" && report.status !== "RETURNED") {
      return NextResponse.json({ error: "Only draft or returned reports can be edited." }, { status: 409 });
    }

    const structuredData = body.structuredData ?? report.structuredData;
    const source = body.source as string | undefined;
    const validation = validateReport({ source: source ?? "", requiredFields: body.requiredFields ?? [], data: structuredData });
    const now = new Date();
    const changed = JSON.stringify(structuredData) !== JSON.stringify(report.structuredData);

    const writes = [
      db
        .update(reports)
        .set({
          structuredData,
          reportDate: body.reportDate ?? report.reportDate,
          reportTime: body.reportTime ?? report.reportTime,
          shift: body.shift ?? report.shift,
          location: body.location ?? report.location,
          updatedAt: now,
        })
        .where(eq(reports.id, id)),
    ];
    if (source !== undefined) {
      writes.push(db.insert(reportMessages).values({ id: crypto.randomUUID(), reportId: id, sourceText: source, receivedAt: now, createdAt: now, updatedAt: now }));
    }
    if (changed) {
      writes.push(
        db.insert(reportVersions).values({ id: crypto.randomUUID(), reportId: id, versionNumber: now.getTime(), content: report.generatedContent ?? "", structuredData, changedBy: actor.id, changeType: "EDIT", createdAt: now }),
      );
      writes.push(db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report", entityId: id, action: "edited", metadata: { validation }, createdAt: now }));
    }
    await db.batch(writes as Parameters<typeof db.batch>[0]);
    return NextResponse.json({ id, validation });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "Unable to process report." }, { status: 500 });
}
