import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { airports, auditLogs, reportMessages, reports } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";
import { validateReport } from "@/lib/reports/validation";
import { buildReportsFilter } from "@/lib/reports/scope";
import { generateReportNumber, isUniqueConstraintError } from "@/lib/reports/numbering";
import type { ReportStatus } from "@/lib/reports/workflow";

export async function GET(request: Request) {
  try {
    const actor = await requirePermission("report:create");
    const status = new URL(request.url).searchParams.get("status") as ReportStatus | null;
    const db = getDb();
    const filter = buildReportsFilter(actor, { status });
    const rows = await db.select().from(reports).where(filter).orderBy(desc(reports.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("report:create");
    const body = await request.json();
    if (!body.airportId || !body.reportTypeId || !body.reportDate) {
      return NextResponse.json({ error: "airportId, reportTypeId and reportDate are required." }, { status: 422 });
    }
    const validation = validateReport({ source: body.source ?? "", requiredFields: body.requiredFields ?? [], data: body.structuredData ?? {} });
    const db = getDb();
    const [airport] = await db.select({ code: airports.code }).from(airports).where(eq(airports.id, body.airportId)).limit(1);
    if (!airport) return NextResponse.json({ error: "Unknown airport." }, { status: 422 });

    const id = crypto.randomUUID();
    const now = new Date();
    let reportNumber = "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      reportNumber = await generateReportNumber(db, airport.code, now);
      try {
        await db.batch([
          db.insert(reports).values({
            id,
            reportNumber,
            airportId: body.airportId,
            unitId: body.unitId ?? null,
            reportTypeId: body.reportTypeId,
            templateId: body.templateId ?? null,
            reportDate: body.reportDate,
            reportTime: body.reportTime ?? null,
            shift: body.shift ?? null,
            location: body.location ?? null,
            status: "DRAFT",
            structuredData: body.structuredData ?? {},
            submittedBy: actor.id,
            createdAt: now,
            updatedAt: now,
          }),
          db.insert(reportMessages).values({ id: crypto.randomUUID(), reportId: id, sourceText: body.source ?? "", receivedAt: now, createdAt: now, updatedAt: now }),
          db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report", entityId: id, action: "created", metadata: { validation }, createdAt: now }),
        ]);
        break;
      } catch (error) {
        if (attempt === 2 || !isUniqueConstraintError(error)) throw error;
      }
    }
    return NextResponse.json({ id, reportNumber, status: "DRAFT", validation }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: "Unable to process report." }, { status: 500 });
}
