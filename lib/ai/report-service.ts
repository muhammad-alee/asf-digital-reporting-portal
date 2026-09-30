import { z } from "zod";

export const AIReportResultSchema = z.object({
  classification: z.string(), confidence: z.number().min(0).max(1),
  missing_fields: z.array(z.string()), contradictions: z.array(z.string()),
  warnings: z.array(z.string()), structured_facts: z.record(z.string(), z.unknown()),
  generated_subject: z.string(), generated_report: z.string(),
});
export type AIReportResult = z.infer<typeof AIReportResultSchema>;

/** Provider boundary: replace with the approved server-side LLM adapter in deployment. */
export function buildSafePrompt(source: string, template: string) {
  return `Use only source-supported facts. Never invent, confirm uncertain claims, or approve a report.\nTemplate: ${template}\nSource: ${source}`;
}

/** Reserved structured_data key: when present, it overrides the template's
 *  fixed subject_pattern instead of being rendered as its own details
 *  bullet. Lets any report type (starting with "Other / General Activity")
 *  offer a free-text subject without special-casing a type code anywhere. */
export const CUSTOM_SUBJECT_FIELD_KEY = "custom_subject";

export type TemplateInput = {
  reportTypeName: string;
  airportName: string;
  reportDate: string;
  subjectPattern: string;
  templateBody: string;
  structuredData: Record<string, unknown>;
  fieldLabels: Record<string, string>;
  sourceText: string;
  missingFields: string[];
  contradictions: string[];
  warnings: string[];
};

/**
 * Default AI adapter: a deterministic, no-external-call template fill.
 * It never fabricates a value — a field with no source-supplied data is
 * rendered as "Not provided" rather than guessed, matching the AI safety
 * rules (no invented facts, no confirmed-status upgrades). Swap this for a
 * real provider call behind the same signature once one is approved.
 */
export function generateDeterministicReport(input: TemplateInput): AIReportResult {
  const customSubject = String(input.structuredData[CUSTOM_SUBJECT_FIELD_KEY] ?? "").trim();
  const subject = customSubject || input.subjectPattern;

  const fieldBullets = Object.entries(input.fieldLabels)
    .filter(([key]) => key !== CUSTOM_SUBJECT_FIELD_KEY)
    .map(([key, label]) => `● ${label}: ${formatValue(input.structuredData[key])}`);
  const notes = input.sourceText.trim();
  const details = [...fieldBullets, notes ? `● Notes: ${notes}` : null].filter(Boolean).join("\n");

  const generated_report = fillTemplate(input.templateBody, {
    airport: input.airportName,
    subject,
    date: input.reportDate,
    details: details || "● No structured facts were provided.",
    ...stringifyValues(input.structuredData),
  });

  return {
    classification: input.reportTypeName,
    confidence: input.missingFields.length === 0 && input.contradictions.length === 0 ? 0.95 : 0.6,
    missing_fields: input.missingFields,
    contradictions: input.contradictions,
    warnings: input.warnings,
    structured_facts: input.structuredData,
    generated_subject: subject,
    generated_report,
  };
}

function fillTemplate(template: string, tokens: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? "Not provided");
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "Not provided";
  return String(value);
}

function stringifyValues(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, formatValue(value)]));
}
