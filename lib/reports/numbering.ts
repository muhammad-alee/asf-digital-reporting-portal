import { and, gte, lt, sql } from "drizzle-orm";
import type { getDb } from "@/db";
import { reports } from "../../db/schema.ts";

/**
 * ASF-<AIRPORT>-<YYYY>-<MMDD>-<seq>, seq is a per-airport, per-day counter.
 * Retries on the unique-index collision that can occur under concurrent
 * submissions instead of trusting a single count-then-insert read.
 */
export async function generateReportNumber(
  db: ReturnType<typeof getDb>,
  airportCode: string,
  date: Date,
): Promise<string> {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const dayStart = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const prefix = `ASF-${airportCode.toUpperCase()}-${year}-${month}${day}`;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reports)
    .where(and(gte(reports.createdAt, new Date(dayStart)), lt(reports.createdAt, new Date(dayEnd))));

  return formatNumber(prefix, count + 1);
}

export function formatNumber(prefix: string, seq: number) {
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Error && /unique/i.test(error.message);
}
