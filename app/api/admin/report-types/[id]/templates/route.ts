import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, reportTemplates } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:admin");
    const { id: reportTypeId } = await context.params;
    const body = await request.json();
    const subjectPattern = String(body.subjectPattern ?? "").trim();
    const templateBody = String(body.templateBody ?? "").trim();
    const requiredFields: string[] = Array.isArray(body.requiredFields)
      ? body.requiredFields
      : String(body.requiredFields ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
    if (!subjectPattern || !templateBody) return NextResponse.json({ error: "subjectPattern and templateBody are required." }, { status: 422 });

    const db = getDb();
    const existing = await db.select().from(reportTemplates).where(eq(reportTemplates.reportTypeId, reportTypeId)).orderBy(desc(reportTemplates.version));
    const nextVersion = (existing[0]?.version ?? 0) + 1;
    const id = crypto.randomUUID();
    const now = new Date();

    const writes = existing
      .filter(t => t.status === "active")
      .map(t => db.update(reportTemplates).set({ status: "inactive", updatedAt: now }).where(eq(reportTemplates.id, t.id)));
    writes.push(
      db.insert(reportTemplates).values({ id, reportTypeId, version: nextVersion, subjectPattern, templateBody, requiredFields, status: "active", createdAt: now, updatedAt: now }),
    );
    writes.push(
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report_template", entityId: id, action: "published", metadata: { reportTypeId, version: nextVersion }, createdAt: now }),
    );
    await db.batch(writes as Parameters<typeof db.batch>[0]);
    return NextResponse.json({ id, version: nextVersion }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to publish the template." }, { status: 500 });
  }
}
