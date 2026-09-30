import assert from "node:assert/strict";
import test from "node:test";
import { canReviewQueue, canViewAllAirports, canViewReport } from "../lib/reports/scope.ts";
import type { Actor } from "../lib/reports/scope.ts";

test("only ADMIN and AUDITOR can see every airport's reports", () => {
  assert.equal(canViewAllAirports("ADMIN"), true);
  assert.equal(canViewAllAirports("AUDITOR"), true);
  assert.equal(canViewAllAirports("SUPERVISOR"), false);
  assert.equal(canViewAllAirports("DATA_ENTRY"), false);
});

test("reviewer roles (and admin/auditor) can open a review queue", () => {
  for (const role of ["SUPERVISOR", "REPORT_OFFICER", "COMMANDER", "ADMIN", "AUDITOR"] as const) {
    assert.equal(canReviewQueue(role), true);
  }
  assert.equal(canReviewQueue("DATA_ENTRY"), false);
});

test("a data-entry actor can only view their own report", () => {
  const actor: Actor = { id: "u1", role: "DATA_ENTRY", airportId: "airport-1" };
  assert.equal(canViewReport(actor, { airportId: "airport-1", submittedBy: "u1" }), true);
  assert.equal(canViewReport(actor, { airportId: "airport-1", submittedBy: "u2" }), false);
});

test("a supervisor can view any report in their own airport, not another one", () => {
  const actor: Actor = { id: "u1", role: "SUPERVISOR", airportId: "airport-1" };
  assert.equal(canViewReport(actor, { airportId: "airport-1", submittedBy: "someone-else" }), true);
  assert.equal(canViewReport(actor, { airportId: "airport-2", submittedBy: "someone-else" }), false);
});

test("an auditor can view a report anywhere", () => {
  const actor: Actor = { id: "u1", role: "AUDITOR", airportId: "airport-1" };
  assert.equal(canViewReport(actor, { airportId: "airport-9", submittedBy: "someone-else" }), true);
});
