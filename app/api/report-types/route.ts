import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { currentActor } from "@/lib/server/actor";
import { getActiveReportTypesWithFields } from "@/lib/reports/report-types";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const result = await getActiveReportTypesWithFields(getDb());
  return NextResponse.json(result);
}
