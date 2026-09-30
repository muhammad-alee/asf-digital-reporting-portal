import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { airports, reports, units } from "@/db/schema";
import { currentActor } from "@/lib/server/actor";
import { getActiveReportTypesWithFields } from "@/lib/reports/report-types";
import { buildReportsFilter } from "@/lib/reports/scope";
import { PortalApp } from "@/components/portal/portal-app";

export default async function Home() {
  const actor = await currentActor();
  if (!actor) redirect(chatGPTSignInPath("/"));

  const db = getDb();
  const [reportTypes, airportRows, unitRows, initialReports] = await Promise.all([
    getActiveReportTypesWithFields(db),
    db.select().from(airports).where(eq(airports.active, true)).orderBy(asc(airports.name)),
    db.select().from(units).orderBy(asc(units.name)),
    db.select().from(reports).where(buildReportsFilter(actor, {})).orderBy(desc(reports.createdAt)).limit(50),
  ]);

  return (
    <PortalApp
      actor={{ displayName: actor.displayName, role: actor.role, airportId: actor.airportId }}
      reportTypes={reportTypes}
      airports={airportRows}
      units={unitRows}
      initialReports={initialReports}
    />
  );
}
