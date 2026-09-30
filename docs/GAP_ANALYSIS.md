# ASF Digital Reporting Portal — Gap Analysis & Reorganized Plan

This replaces the flat, 26-part spec document with a structure organized by
**decision → data → workflow → surface**, and cross-checks it against what is
actually implemented in this repository today (`app/`, `db/`, `lib/`).

---

## 1. How the source spec is organized today (and why it's hard to use)

The original spec (`ASF Digital Reporting Portal — Complete Build
Specification...md`) is 3,150 lines across 26 parts. Problems with its
structure:

- **Parts 1–25 and Part 26 ("Master Codex Prompt") duplicate each other almost
  entirely.** Roles, schema, screens, AI rules and the roadmap are stated once
  as spec, then restated nearly verbatim as a prompt. Any future edit has to
  be made twice or it silently drifts.
- **No single source of truth for "done."** Acceptance criteria (Part 23),
  test cases (Part 24), MVP scope (Part 20) and "Definition of Done" (inside
  Part 26) overlap but aren't cross-referenced.
- **Flat part numbering hides dependency order.** "AI System Prompt" (Part
  13) appears before "API Design" (Part 16) and "Tech Stack" (Part 17), even
  though the AI prompt depends on the data contracts defined later.
- **Non-functional requirements are scattered or missing** — see §2.
- **The stack recommendation (Part 17) doesn't match the environment this
  project actually runs on** (see §3) — it specifies Supabase/PostgreSQL, but
  this repo is a Cloudflare Workers + D1 (SQLite) + platform-provided
  authentication project.

### Reorganized structure (used for §4 roadmap below)

```text
1. Product intent & non-negotiable principles      (spec Parts 1–2, 25 Codex intro)
2. Data model                                       (spec Parts 6–7)
3. Access control & scope                           (spec Part 3, 8, security in Part 26)
4. Workflow engine (state machine)                   (spec Part 4, 10)
5. Dynamic forms & template engine                   (spec Part 4–5, Screens 04/11/12)
6. AI service (classify → validate → generate)       (spec Parts 13–15, AI Safety in Part 26)
7. Screens & UX                                      (spec Part 9)
8. API surface                                       (spec Part 16)
9. Cross-cutting: incidents, duplicates, audit, PDF  (spec Parts 11–12, security)
10. Non-functional requirements                      (missing from spec — added below)
11. Roadmap, phased by what's already built           (spec Parts 20–25, corrected)
```

---

## 2. Gaps in the specification itself (independent of code)

These are missing or ambiguous even before comparing to the implementation:

1. **PII protection has no concrete design.** The spec says "do not expose
   sensitive fields to users who do not require them" (7.15) but never
   defines a field-level permission model, encryption-at-rest requirement, or
   masking rule (e.g. who can see a full CNIC/passport number vs. a masked
   last-4).
2. **`REPORT_OFFICER` and `COMMANDER` are one role with two names.** Part 3
   lists them as "Role 3 — Report Officer / Commander" with identical
   permissions, but Part 7.2 and Part 26 list them as two separate role codes
   with no distinction in privileges. Pick one.
3. **No report/incident numbering algorithm.** Examples like
   `ASF-MIAP-2026-0914-004` and `INC-MIAP-2026-000147` appear, but the
   generation rule (per-airport counter? per-day? padding? collision
   handling under concurrent writes?) is never specified.
4. **No retention/archival policy.** Passport numbers, CNICs and recovery
   details are stored indefinitely with no stated retention window, legal
   basis, or deletion/anonymization path — a real gap for an
   operational/security system handling personal data.
5. **No non-functional requirements at all**: no uptime target, no response
   time budget, no concurrent-user assumption, no backup/DR plan, no
   rate-limit numbers, no file-size/type limits for attachments, no
   accessibility (WCAG) target, no localization requirement despite an Urdu-
   speaking user base.
6. **Notification/escalation is unspecified.** A report can sit in
   `PENDING_REVIEW` forever with no SLA, no reviewer reassignment, and no
   notification back to the submitter when a report is returned or rejected.
7. **Reviewer scope is unclear.** Can any supervisor approve any unit's
   report, or only their own unit/airport? "view reports assigned to unit"
   (Part 3) implies scoping but the DB schema and permission model (Part 7,
   26) never enforce it.
8. **Duplicate detection and incident grouping (Parts 11–12) have no
   threshold or algorithm** — "if similarity is high" is not actionable
   without a defined comparison (exact-match fields? fuzzy text? time
   window?).
9. **AI provider is never named**, and "approved AI provider" is undefined —
   reasonable for a spec document, but it means the AI service must be built
   behind a swappable interface with a safe default (already partially true
   in code, see §3).

---

## 3. Gaps between the spec and what is actually built right now

This is the more important gap: the repo already has a real (if partial)
implementation, and the spec's tech stack section doesn't match it.

**Confirmed environment facts** (from `package.json`, `db/index.ts`,
`app/chatgpt-auth.ts`, `.wrangler/`, `.openai/`):

- Hosting is **Cloudflare Workers**, not a generic Next.js deploy.
- The database is **Cloudflare D1 (SQLite via Drizzle)**, not
  Supabase/PostgreSQL as spec Part 17 recommends.
- Authentication is **platform-injected via `oai-authenticated-user-*`
  request headers** (`app/chatgpt-auth.ts`), not Supabase Auth.
- There is no `AI_API_KEY` wiring yet — `lib/ai/report-service.ts` only
  exports a Zod schema and a prompt-string builder.

None of this is wrong — it's just a different (and already-decided) stack
than spec Part 17 describes, so the "Recommended Tech Stack" section should
be treated as superseded by the environment, not followed literally.

**Implementation status vs. spec, by area:**

| Area | Spec expectation | Current state | Gap |
|---|---|---|---|
| UI ↔ API wiring | Screens call real endpoints | `app/page.tsx` is a **self-contained client mock** — local `useState`, hardcoded 4 report types, a fake `useMemo` "AI draft" that just echoes the textarea. It never calls `/api/reports` or the workflow route. | **Critical.** The backend that exists is invisible to users. |
| Dynamic form engine | Admin-defined fields drive the form (Screen 12) | `form_fields` table exists but is **empty and unread** — report types/fields are a hardcoded TS object (`definitions`) in `page.tsx`. | Full dynamic-form engine still to build. |
| Report templates | Versioned templates drive generation (7.6) | `report_templates` table exists, unseeded, unread by any code path. | Not implemented. |
| API surface (Part 16) | ~15 endpoints | Only `POST/GET /api/reports` and `POST /api/reports/:id/workflow` exist. Missing: `GET /api/reports/:id`, `PATCH /api/reports/:id`, `/validate`, `/generate`, review-queue listing, `/api/report-types`, `/api/templates`, `/api/incidents`, `/api/attachments`, `/api/analytics`, `/api/auth/*` (n/a — platform-handled). | ~80% of the API surface is missing. |
| Review queue | Supervisor sees reports scoped to their unit | No endpoint returns `PENDING_REVIEW` reports at all; `GET /api/reports` only returns the **caller's own** submitted reports (`where submittedBy = actor.id`), so a supervisor can't query anything to review. | Blocks the entire approval workflow. |
| Row-level / unit scope | Users "only see records they are authorized to view" | `lib/auth/permissions.ts` is **role-only** — no airport/unit filtering anywhere in the query layer. | RLS-equivalent scoping not implemented. |
| Incidents & duplicate detection | Parts 11–12 | `incidents` table exists; nothing creates, links, or queries it. No duplicate-check logic anywhere. | Not implemented. |
| Passenger/vehicle/recovery/staff tables | Specialized fact tables (7.15–7.18) | Tables exist; `reports.structured_data` is a single opaque JSON blob and nothing writes to the specialized tables. | Specialized entities are schema-only. |
| AI service | Classify, extract, validate, generate (Part 13) | `lib/ai/report-service.ts` has a response schema and a prompt-string helper only — **no model call, no server route invokes it**, and the client-side "generate" button doesn't call the server at all. `lib/reports/validation.ts` has a real (if simple) regex-based contradiction/missing-field checker, but it's invoked in `POST /api/reports` and its result is **discarded** — never returned to or shown in the UI. | AI pipeline is a stub; even the deterministic validation that exists isn't surfaced. |
| Report/incident numbering | `ASF-MIAP-2026-0914-004` style | `reportNumber ?? \`RPT-${Date.now()}\`` — a timestamp, not airport/unit-scoped, not human-legible, and caller-overridable from the request body. | Needs a real generator. |
| Attachments | Upload UI + storage | `attachments` table exists; no upload endpoint, no R2/storage binding, no UI. | Not implemented. |
| Admin screens (11–13) | Templates, form builder, users | `Admin` component in `page.tsx` is one paragraph of static text. | Not implemented. |
| Analytics (Screen 14) | Charts/cards | Not present anywhere. | Not implemented. |
| PDF export | Server-side from finalized version only | Not present. | Not implemented. |
| Audit log visibility | Auditor role can read the trail | Writes happen correctly on create/workflow transitions; there is **no read surface** anywhere (no screen, no endpoint) for the `AUDITOR` role that already exists in `permissions.ts`. | Write path only. |
| Auth-aware shell | Login screen, role-aware nav | `page.tsx` never calls `getChatGPTUser`/`requireChatGPTUser`; the sidebar hardcodes a `"RO"` avatar regardless of who is signed in. | Not wired. |
| Tests | Unit/integration/e2e (Part 24, "Testing") | One file, `tests/workflow.test.ex ts`, covering only the state-machine helper. Validation, permissions, and API routes are untested. | Minimal coverage. |
| Sensitive-field exposure | "Do not expose sensitive fields to users who do not require them" | `passengers.passportNumber` / `.cnic` have no masking, no field-level permission check anywhere in the code that reads them (none currently reads them at all, since nothing writes to that table yet). | Needs a policy before the table is used. |

**What already works and is worth keeping as-is:**

- `lib/reports/workflow.ts` — the state machine is small, correct, and
  matches the spec's lifecycle (draft → submit → review → approve →
  finalize, with return/reject side paths).
- `lib/auth/permissions.ts` — the role→permission grant table is a clean
  starting point; it just needs scope (airport/unit) added.
- `db/schema.ts` — the relational model is a faithful, reasonably complete
  translation of spec Part 7 into Drizzle/SQLite. Main gaps are the missing
  `report_number`/`incident_number` generation strategy and no explicit
  index on `airport_id`/`unit_id` for scoped queries.
- The two existing API routes correctly batch DB writes with the matching
  audit-log entry — that pattern should be reused for every new endpoint.

---

## 4. Reorganized roadmap

Phased by *what unlocks the most currently-dead code*, not by the spec's
original sprint numbers (which assumed a green-field build and don't account
for the fact that a backend already exists with no frontend wired to it).

### Phase 1 — Make the existing backend visible ✅ done
- Wired `app/page.tsx` and the whole portal shell to real `GET/POST
  /api/reports`, `GET/PATCH /api/reports/:id`, and the workflow route;
  removed all client-only mock state.
- Added an auth-aware shell: sign-in gate via `currentActor`/
  `chatGPTSignInPath`, real display name/role in the sidebar.
- Surfaced `validateReport()`'s result as the real "AI validation" warnings
  panel instead of a fabricated list.
- Added deterministic, collision-safe report numbering (`lib/reports/
  numbering.ts`) and airport-scoped read access (`lib/reports/scope.ts`) —
  this pulled forward everything originally scoped as "Phase 3" below.

### Phase 2 — Dynamic forms & templates, admin-managed report types ✅ done
- Report types/fields/templates are read from the database
  (`GET /api/report-types`) and drive the New Report form generically —
  no report type is hardcoded in the UI any more.
- A full admin CRUD surface (`/api/admin/report-types*`, `components/
  portal/admin.tsx`) lets an ADMIN create new report types, add/remove
  fields, and publish new template versions from inside the app — no
  migration or seed edit needed. Template publishing always creates a new
  version and marks the previous one inactive, never overwriting one in
  place.
- Added a reserved `custom_subject` structured-data key
  (`lib/ai/report-service.ts`) so any report type — starting with the
  seeded "Other / General Activity" type — can let the submitter write
  their own subject line instead of being limited to a fixed
  `subject_pattern`. Generation also now includes the free-text source
  notes verbatim in the generated report, which it previously discarded
  entirely after using it only for validation.

### Phase 3 — Real report numbering + row-level scope ✅ done (folded into Phase 1)

### Phase 4 — AI service
- `lib/ai/report-service.ts`'s `generateDeterministicReport` is a
  deterministic, no-external-call template fill (the "mock implementation"
  the spec asks for) — still not a real model call. Wire an adapter for an
  approved external LLM provider behind the same `TemplateInput` →
  `AIReportResult` signature.

### Phase 5 — Finalize/PDF, incidents, duplicates, attachments, audit viewer, analytics
- **Finalize + Final Report screen** — real gap, not yet built: the workflow
  already supports an `APPROVED → FINALIZED` transition, but no UI ever
  triggers it, and there is no Screen-08-equivalent (Copy/Print/PDF of the
  finalized report). This should be the first item in this phase.
- Incident grouping, duplicate detection, attachment upload, an audit-log
  viewer, and analytics are each independently valuable but none block the
  others — build in whichever order matches real usage priority.

### Non-functional requirements to define before production use (net-new, not in spec)
- PII field-level access policy + retention window for `passengers`.
- Rate limiting and attachment size/type limits.
- Backup/restore process for D1.
- Reviewer SLA/escalation (out of scope for MVP, flagged for Version 2).

---

## 5. What's implemented so far

Phases 1–3 are done (real data flow, real auth, real review queue, real
numbering/scoping) and Phase 2 is now also done (database-driven report
types/fields/templates, an in-app admin screen to manage them, and a
free-text "Other" report type so users are never limited to a fixed preset
list). Phase 4 (real external AI provider) and Phase 5 (Finalize/PDF,
incidents, duplicates, attachments, audit viewer, analytics) remain, in that
priority order — Finalize/PDF first, since it's a hard MVP
acceptance-criterion miss rather than a nice-to-have.
