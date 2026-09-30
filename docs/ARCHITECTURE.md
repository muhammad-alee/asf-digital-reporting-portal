# Architecture

```text
Browser UI → server-side authorization → report/workflow service → D1 database
                                           ↓
                                  approved AI provider (draft only)
```

Source messages are stored separately from generated output. Every meaningful change creates a report version and audit event. The workflow is constrained to draft, review, approval and finalization states; only a human with the correct server-verified role can approve or finalize.

## Folder guide

- `app/` — screens (server components) and API route handlers
- `components/portal/` — the client-side portal shell and its views (report
  editor, history, review queue, admin), wired to the API routes below
- `db/` — Drizzle schema, seed data and database access
- `lib/ai/` — AI provider boundary; `generateDeterministicReport` is the
  current default (no external call) implementation
- `lib/auth/` — role/permission grants
- `lib/reports/` — workflow state machine, deterministic validation,
  report numbering, and role/airport scoping (`scope.ts`)
- `lib/server/actor.ts` — resolves the signed-in identity to a DB user row
  and enforces permissions for route handlers
- `docs/` — project memory, architecture, operations guide, and
  `GAP_ANALYSIS.md` (the phased roadmap)
- `tests/` — `node --test` unit tests for the `lib/` modules above
- `public/` — static application assets

## API surface

```text
GET    /api/report-types                          active report types + fields + template
GET    /api/reports                                role/airport-scoped list; ?status=
POST   /api/reports                                create a draft (numbers it, validates it)
GET    /api/reports/:id                            one report + its messages + reviews
PATCH  /api/reports/:id                             edit a draft/returned report
POST   /api/reports/:id/generate                   deterministic template-fill "AI" draft
POST   /api/reports/:id/workflow                   SUBMIT / RETURN / REJECT / APPROVE / FINALIZE

GET    /api/admin/report-types                     all report types (active + inactive) + fields + template history
POST   /api/admin/report-types                     create a report type
PATCH  /api/admin/report-types/:id                  rename / activate / deactivate a report type
POST   /api/admin/report-types/:id/fields           add a field
PATCH  /api/admin/fields/:id                         edit a field
DELETE /api/admin/fields/:id                         remove a field
POST   /api/admin/report-types/:id/templates        publish a new template version (never overwrites the current one)
```

All `/api/admin/*` routes require the `report:admin` permission, granted only to `ADMIN` (`lib/auth/permissions.ts`).
