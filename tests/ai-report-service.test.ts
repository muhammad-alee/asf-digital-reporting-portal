import assert from "node:assert/strict";
import test from "node:test";
import { generateDeterministicReport } from "../lib/ai/report-service.ts";

const base = {
  reportTypeName: "Snap Checking",
  airportName: "Demonstration Airport",
  reportDate: "2026-09-14",
  subjectPattern: "Snap Checking of Landside Areas",
  templateBody: "Sub: {{subject}}\nDated: {{date}}\n{{details}}",
  fieldLabels: {} as Record<string, string>,
  structuredData: {} as Record<string, unknown>,
  sourceText: "",
  missingFields: [] as string[],
  contradictions: [] as string[],
  warnings: [] as string[],
};

test("uses the template's subject pattern when no custom subject is set", () => {
  const result = generateDeterministicReport(base);
  assert.equal(result.generated_subject, "Snap Checking of Landside Areas");
  assert.match(result.generated_report, /Sub: Snap Checking of Landside Areas/);
});

test("a custom_subject field overrides the template's subject pattern", () => {
  const result = generateDeterministicReport({ ...base, structuredData: { custom_subject: "Unscheduled Perimeter Breach" } });
  assert.equal(result.generated_subject, "Unscheduled Perimeter Breach");
  assert.match(result.generated_report, /Sub: Unscheduled Perimeter Breach/);
});

test("custom_subject is not duplicated as a details bullet", () => {
  const result = generateDeterministicReport({
    ...base,
    fieldLabels: { custom_subject: "Subject" },
    structuredData: { custom_subject: "Unscheduled Perimeter Breach" },
  });
  assert.doesNotMatch(result.generated_report, /Subject: Unscheduled Perimeter Breach/);
});

test("non-empty source text is appended to the details section", () => {
  const result = generateDeterministicReport({ ...base, sourceText: "Fence breach observed near gate 4." });
  assert.match(result.generated_report, /Notes: Fence breach observed near gate 4\./);
});

test("empty source text does not add a stray notes bullet", () => {
  const result = generateDeterministicReport(base);
  assert.doesNotMatch(result.generated_report, /Notes:/);
});
