import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, formFields } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:admin");
    const { id: reportTypeId } = await context.params;
    const body = await request.json();
    const fieldKey = String(body.fieldKey ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const label = String(body.label ?? "").trim();
    if (!fieldKey || !label) return NextResponse.json({ error: "fieldKey and label are required." }, { status: 422 });

    const db = getDb();
    const [last] = await db.select({ sortOrder: formFields.sortOrder }).from(formFields).where(eq(formFields.reportTypeId, reportTypeId)).orderBy(desc(formFields.sortOrder)).limit(1);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.batch([
      db.insert(formFields).values({ id, reportTypeId, fieldKey, label, type: "text", required: Boolean(body.required), sortOrder: (last?.sortOrder ?? 0) + 1, createdAt: now, updatedAt: now }),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "form_field", entityId: id, action: "created", metadata: { reportTypeId, fieldKey, label }, createdAt: now }),
    ]);
    return NextResponse.json({ id, fieldKey, label }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to add the field." }, { status: 500 });
  }
}
