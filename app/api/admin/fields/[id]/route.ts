import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, formFields } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:admin");
    const { id } = await context.params;
    const body = await request.json();
    const db = getDb();
    const [existing] = await db.select().from(formFields).where(eq(formFields.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Field not found." }, { status: 404 });

    const label = body.label !== undefined ? String(body.label).trim() : existing.label;
    const required = body.required !== undefined ? Boolean(body.required) : existing.required;
    const now = new Date();
    await db.batch([
      db.update(formFields).set({ label, required, updatedAt: now }).where(eq(formFields.id, id)),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "form_field", entityId: id, action: "updated", metadata: { label, required }, createdAt: now }),
    ]);
    return NextResponse.json({ id, label, required });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to update the field." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("report:admin");
    const { id } = await context.params;
    const db = getDb();
    const [existing] = await db.select().from(formFields).where(eq(formFields.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Field not found." }, { status: 404 });

    const now = new Date();
    await db.batch([
      db.delete(formFields).where(eq(formFields.id, id)),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "form_field", entityId: id, action: "deleted", metadata: { fieldKey: existing.fieldKey, reportTypeId: existing.reportTypeId }, createdAt: now }),
    ]);
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to remove the field." }, { status: 500 });
  }
}
