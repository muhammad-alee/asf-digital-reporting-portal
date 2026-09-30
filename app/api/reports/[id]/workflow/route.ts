import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, reportReviews, reports } from "@/db/schema";
import { requirePermission } from "@/lib/server/actor";
import { canTransition, nextStatus, requiresComment, type WorkflowAction, type ReportStatus } from "@/lib/reports/workflow";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json(); const action = body.action as WorkflowAction; const { id } = await context.params;
    const permission = action === "APPROVE" || action === "FINALIZE" ? "report:approve" : action === "RETURN" || action === "REJECT" ? "report:review" : "report:submit";
    const actor = await requirePermission(permission); if (requiresComment(action) && !body.comment?.trim()) return NextResponse.json({ error: "A comment is required." }, { status: 422 });
    const db = getDb(); const current = await db.select({ status: reports.status }).from(reports).where(eq(reports.id, id)).limit(1); if (!current[0] || !canTransition(current[0].status as ReportStatus, action)) return NextResponse.json({ error: "This workflow action is not allowed." }, { status: 409 });
    const now = new Date(), status = nextStatus(action);
    await db.batch([db.update(reports).set({ status, updatedAt: now, finalizedAt: action === "FINALIZE" ? now : undefined }).where(eq(reports.id, id)), db.insert(reportReviews).values({ id: crypto.randomUUID(), reportId: id, reviewerId: actor.id, action, comments: body.comment ?? null, createdAt: now }), db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: actor.id, entityType: "report", entityId: id, action: action.toLowerCase(), metadata: { status }, createdAt: now })]);
    return NextResponse.json({ id, status });
  } catch (error) { if (error instanceof Response) return new NextResponse(error.body, { status: error.status }); console.error(error); return NextResponse.json({ error: "Unable to change report workflow." }, { status: 500 }); }
}
