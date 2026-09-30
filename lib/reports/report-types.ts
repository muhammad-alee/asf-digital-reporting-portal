import { and, asc, desc, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { formFields, reportTemplates, reportTypes } from "@/db/schema";

export type FormField = typeof formFields.$inferSelect;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type ReportType = typeof reportTypes.$inferSelect;
export type ReportTypeWithFields = ReportType & { fields: FormField[]; template: ReportTemplate | null };

/** Active report types with their ordered form fields and current active template. */
export async function getActiveReportTypesWithFields(db: ReturnType<typeof getDb>): Promise<ReportTypeWithFields[]> {
  const types = await db.select().from(reportTypes).where(eq(reportTypes.active, true));
  return Promise.all(
    types.map(async type => {
      const [fields, templates] = await Promise.all([
        db.select().from(formFields).where(eq(formFields.reportTypeId, type.id)).orderBy(asc(formFields.sortOrder)),
        db
          .select()
          .from(reportTemplates)
          .where(and(eq(reportTemplates.reportTypeId, type.id), eq(reportTemplates.status, "active")))
          .orderBy(desc(reportTemplates.version))
          .limit(1),
      ]);
      return { ...type, fields, template: templates[0] ?? null };
    }),
  );
}
