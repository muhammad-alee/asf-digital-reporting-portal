import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, reportTypes } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:admin");
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();
    const [existing] = await db.select().from(reportTypes).where(eq(reportTypes.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Report type not found." }, { status: 404 });

    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    const active = body.active !== undefined ? Boolean(body.active) : existing.active;
    const now = new Date();
    await db.batch([
      db.update(reportTypes).set({ name, active, updatedAt: now }).where(eq(reportTypes.id, id)),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report_type", entityId: id, action: "updated", metadata: { name, active }, createdAt: now }),
    ]);
    return NextResponse.json({ id, name, active });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to update the report type." }, { status: 500 });
  }
}
