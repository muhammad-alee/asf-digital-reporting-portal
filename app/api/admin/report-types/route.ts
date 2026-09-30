import { asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, formFields, reportTemplates, reportTypes } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";

export async function GET() {
  try {
    await requirePermission("report:admin");
    const db = getDb();
    const types = await db.select().from(reportTypes).orderBy(asc(reportTypes.name));
    const result = await Promise.all(
      types.map(async type => {
        const [fields, templates] = await Promise.all([
          db.select().from(formFields).where(eq(formFields.reportTypeId, type.id)).orderBy(asc(formFields.sortOrder)),
          db.select().from(reportTemplates).where(eq(reportTemplates.reportTypeId, type.id)).orderBy(desc(reportTemplates.version)),
        ]);
        return { ...type, fields, templates };
      }),
    );
    return NextResponse.json(result);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requirePermission("report:admin");
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "_");
    const name = String(body.name ?? "").trim();
    if (!code || !name) return NextResponse.json({ error: "code and name are required." }, { status: 422 });

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();
    await db.batch([
      db.insert(reportTypes).values({ id, code, name, active: true, createdAt: now, updatedAt: now }),
      db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report_type", entityId: id, action: "created", metadata: { code, name }, createdAt: now }),
    ]);
    return NextResponse.json({ id, code, name }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof Response) return new NextResponse(error.body, { status: error.status });
  if (error instanceof Error && /unique/i.test(error.message)) return NextResponse.json({ error: "A report type with that code already exists." }, { status: 409 });
  console.error(error);
  return NextResponse.json({ error: "Unable to process the request." }, { status: 500 });
}
