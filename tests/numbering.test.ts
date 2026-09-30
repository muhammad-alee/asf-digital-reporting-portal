import assert from "node:assert/strict";
import test from "node:test";
import { formatNumber, isUniqueConstraintError } from "../lib/reports/numbering.ts";

test("formats a zero-padded sequence onto the prefix", () => {
  assert.equal(formatNumber("ASF-DEMO-2026-0914", 4), "ASF-DEMO-2026-0914-004");
  assert.equal(formatNumber("ASF-DEMO-2026-0914", 123), "ASF-DEMO-2026-0914-123");
});

test("recognizes a unique-constraint failure message", () => {
  assert.equal(isUniqueConstraintError(new Error("UNIQUE constraint failed: reports.report_number")), true);
  assert.equal(isUniqueConstraintError(new Error("some other failure")), false);
  assert.equal(isUniqueConstraintError("not an error"), false);
});
