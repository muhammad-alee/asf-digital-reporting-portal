# ASF Digital Reporting Portal — Project Memory

## Purpose
Replace the manual rewriting of airport operational WhatsApp messages with a controlled reporting workflow. The system turns verified source material into a formal ASF-style draft, while preserving evidence and requiring human approval.

## Non-negotiable rules
- Source material is immutable and remains linked to every report version.
- AI may classify, extract, flag and draft only. It must never invent facts, convert suspicion into confirmation, approve, or finalize.
- Exact names, identifiers, dates, times, flights and quantities must be retained.
- Finalized reports are immutable in the normal workflow; later corrections create a new version and audit entry.
- Server-side role authorization is required for every privileged action.

## Current implementation slice
Phases 1–3 (see `docs/GAP_ANALYSIS.md`) are complete: the dashboard, report
editor, review queue and history screens are wired to real Cloudflare
D1-backed API routes, gated by the platform's real signed-in identity
(`app/chatgpt-auth.ts`). Report numbers are airport/day-scoped and
collision-checked; reads are scoped by role and airport
(`lib/reports/scope.ts`) — data entry sees only their own submissions,
reviewer roles see their airport's queue, admin/auditor see everything.

Phase 2 is also complete: report types, their fields, and their templates
are fully database-driven and manageable from an in-app Administration
screen (`components/portal/admin.tsx`, `/api/admin/*`) — an ADMIN can create
a new report type, add fields to it, and publish template versions without
a code change or migration. A reserved `custom_subject` field key lets any
type (starting with the seeded "Other / General Activity" type) offer a
free-text subject instead of a fixed one. "Generate AI draft" runs a real,
deterministic (non-LLM) template-fill service (`lib/ai/report-service.ts`)
that never fabricates a value for a field the source didn't provide, and now
includes the submitter's free-text source notes verbatim in the output.

## Known integration work
Everything tracked as Phase 4–5 in `docs/GAP_ANALYSIS.md`: an approved
external LLM provider behind the existing `lib/ai` boundary; a Finalize
action and Final Report screen (Copy/Print/PDF) — flagged as the top
priority, since the workflow already supports the `APPROVED → FINALIZED`
transition but nothing in the UI triggers it; incident grouping and
duplicate detection; attachment upload; and an audit-log/analytics screen.
