# ASF Digital Reporting Portal

Secure, structured operational reporting for airport activity and incident
messages. The product replaces WhatsApp-and-rewrite reporting with a
controlled workflow: verified source material → database-driven form →
AI-assisted draft → supervisor review → approval — with final say always
held by an authorized human, never the AI.

**Status: Phases 1–3 complete** (real data, real auth, real review
workflow, database-driven report types/forms/templates with an in-app admin
screen). See [Project status](#project-status) below and
[`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md) for the full roadmap.

**📖 [Read the user manual](https://muhammad-alee.github.io/asf-digital-reporting-portal/)** — published via GitHub Pages from `docs/index.html`.

## Documentation

| Doc | For |
|---|---|
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Testers and end users — how to use every screen |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Developers — local setup, sign-in, migrate/seed, testing |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Developers — folder map and full API surface |
| [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md) | Everyone — what's done, what's left, why it's organized this way |
| [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md) | Everyone — the non-negotiable product rules |

## What is included

- Operational dashboard, report editor, review queue and history — all backed by real, database-persisted data behind the signed-in user's role and airport
- Database-driven report type selector and dynamic fact fields (`/api/report-types`) — administrators can add new report types, fields, and template versions from an in-app Administration screen, no code change or migration required
- A free-text "Other / General Activity" report type (and a reusable `custom_subject` mechanism any type can opt into) so users are never limited to a fixed preset list
- Deterministic (non-LLM) draft generation that never fabricates a value for a field the source didn't provide, includes the submitter's free-text notes verbatim, and surfaces real missing-field/contradiction warnings
- Airport/day-scoped report numbering, role+airport-scoped reads, and a real review workflow (submit/return/reject/approve) with required reviewer comments
- D1/Drizzle relational schema for users, roles, reports, incidents, templates, versions, reviews and audit logs

## Architecture

The browser only captures and displays data. Privileged operations belong in server-side route handlers. D1 stores structured data and report history; source messages and finalized report versions must never be overwritten. The AI integration is isolated in `lib/ai/report-service.ts`, so an approved provider can be attached without exposing its key to the browser. Full folder map and API surface: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Required environment variables

This project has no required environment variables today: the database is a Cloudflare D1 binding (`.openai/hosting.json`) and sign-in comes from platform-injected request headers (`app/chatgpt-auth.ts`), not `.env` values. `.env.example` documents the one reserved-for-later variable (`AI_API_KEY`, Phase 4).

## Run locally

```powershell
npm install
npm run dev
```

See [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for the local sign-in flow and the commands to migrate/seed the local D1 database — the app has no data to show until that's done once.

Migrations live in `drizzle/` (`0000_asf_portal.sql` is the baseline, later files are incremental `ALTER TABLE`s); fictional local seed data is in `db/seed.sql`.

## Security and workflow rules

- Check roles and airport scope server-side on every endpoint (`lib/reports/scope.ts`, `lib/server/actor.ts`).
- Keep `DRAFT → SUBMITTED → PENDING_REVIEW → APPROVED → FINALIZED` transitions server-controlled (`lib/reports/workflow.ts`).
- Require comments for return/reject actions and audit each transition (`audit_logs`, `report_reviews`).
- Generate official PDFs only from finalized versions (not yet implemented — Phase 5).
- AI drafts cannot approve or finalize a report, and must only use facts supported by stored source material — the current generator never fills a missing field with a guess.

## Sharing the manual (GitHub Pages)

`docs/index.html` is a self-contained, static walkthrough of every screen, published at **https://muhammad-alee.github.io/asf-digital-reporting-portal/** via **Settings → Pages → Deploy from branch → `master` /docs**. It is **not** the app — it's documentation for people testing the app.

> This repository is public specifically so Pages could be enabled on a free GitHub plan (which doesn't support Pages on private repos). No secrets live here — auth is platform-injected headers with nothing to leak, and all seed/example data is fictional (see `db/seed.sql`). If that trade-off ever stops being acceptable, move `docs/index.html` into its own small public repo and make this one private again.

For the *live, working app* (not just its documentation), GitHub Pages can't help — see [Project status](#project-status) and `docs/GAP_ANALYSIS.md` for what a real deployment needs first (mainly: real authentication, since the current sign-in only works on the platform this was originally scaffolded on).

## Project status

| Phase | Scope | Status |
|---|---|---|
| 1 | Real data flow, real auth, real review queue | ✅ Done |
| 2 | Dynamic forms/templates, in-app admin, free-text report type | ✅ Done |
| 3 | Report numbering, role/airport-scoped access | ✅ Done (folded into Phase 1) |
| 4 | Real external AI/LLM provider | Not started |
| 5 | Finalize action + PDF export, incidents, duplicates, attachments, audit viewer, analytics | Not started — **Finalize/PDF is the top priority**, a workflow state already exists with no UI to trigger it |

Full detail, reasoning, and the original specification's own gaps: [`docs/GAP_ANALYSIS.md`](docs/GAP_ANALYSIS.md).
