import assert from "node:assert/strict";
import test from "node:test";
import { validateReport } from "../lib/reports/validation.ts";

test("flags required fields with no submitted value", () => {
  const result = validateReport({ source: "text", requiredFields: ["flight_number", "quantity"], data: { flight_number: "G9-559" } });
  assert.deepEqual(result.missingFields, ["quantity"]);
});

test("flags conflicting quantities across the source text", () => {
  const result = validateReport({ source: "Message 1: 18 slabs. Message 2: 16 slabs.", requiredFields: [], data: {} });
  assert.equal(result.contradictions.length, 1);
});

test("flags suspected/confirmed language appearing together", () => {
  const result = validateReport({ source: "The item was suspected narcotics, later confirmed by ANF.", requiredFields: [], data: {} });
  assert.equal(result.contradictions.length, 1);
});

test("warns when no source material is present", () => {
  const result = validateReport({ source: "   ", requiredFields: [], data: {} });
  assert.equal(result.warnings.length, 1);
});
