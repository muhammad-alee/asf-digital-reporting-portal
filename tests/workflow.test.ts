import assert from "node:assert/strict";
import test from "node:test";
import { canTransition, nextStatus, requiresComment } from "../lib/reports/workflow.ts";

test("only reviewable reports may be approved", () => {
  assert.equal(canTransition("PENDING_REVIEW", "APPROVE"), true);
  assert.equal(canTransition("DRAFT", "APPROVE"), false);
  assert.equal(nextStatus("APPROVE"), "APPROVED");
});
test("return and reject require a comment", () => {
  assert.equal(requiresComment("RETURN"), true);
  assert.equal(requiresComment("REJECT"), true);
});
