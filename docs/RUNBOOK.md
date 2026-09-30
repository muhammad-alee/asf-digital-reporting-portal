# Local run and test guide

## Start the portal

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

## Local sign-in

Local development uses a mock-auth Vite plugin (`build/sites-vite-plugin.ts`)
instead of the real platform login. The first request redirects to
`/signin-with-chatgpt`; accept it once and the browser is signed in for the
session as the seeded demo user `seedy@sites.test` (`local_seedy`, role
`ADMIN`, seeded in `db/seed.sql`). There is no way to sign in locally as the
other seeded roles (`demo-supervisor`, `demo-entry`) — the mock plugin only
issues one identity — so role-restricted behavior for those roles is covered
by `tests/scope.test.ts` and `lib/auth/permissions.ts` rather than manual
browser testing.

## Database setup (first run, or after a schema change)

The dev server needs its D1 database migrated and seeded before the app has
any data to show. After `npm run build` has produced `dist/server/wrangler.json`
at least once:

```powershell
npx wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file=drizzle/0000_asf_portal.sql
npx wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file=drizzle/0001_loud_ink.sql
npx wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file=db/seed.sql
```

Run any newly generated migration files the same way, in order, after
`npm run db:generate`.

## Manual acceptance checks

1. Select **New report**. Confirm the report type list and its "Required
   facts" fields come from the database (`/api/report-types`), not a
   hardcoded list — switching type changes the field set.
2. Fill the required facts and source material, **Save draft**, then
   **Generate AI draft**. Confirm the preview shows the real
   missing-fields/contradictions warnings computed server-side (try leaving
   one required field blank — it should show as `Missing: <field>` and
   `Not provided` in the generated text, never a fabricated value).
3. **Submit for review**; confirm the report leaves the editor and appears
   in **Report history** as `Pending review` with a real
   `ASF-<AIRPORT>-<YYYY>-<MMDD>-<seq>` report number.
4. Open **Review queue**; confirm the submitted report appears with its
   generated content. Try **Return**/**Reject** with an empty comment (should
   be blocked client-side and server-side) and again with a comment
   (should succeed). Try **Approve** on another report.
5. Confirm **Report history** reflects the final status for each report.

## Automated checks

```powershell
npm test
npm run build
npm run lint
```

`npm test` runs the `lib/` unit tests (`tests/*.test.ts`) directly with
Node's built-in test runner — no framework or build step required.

## Deployment prerequisites

Before treating the portal as an operational system, apply the D1
migrations to the target environment, connect the approved platform
authentication (already wired through `app/chatgpt-auth.ts` — only the local
mock needs replacing), attach an approved LLM provider behind
`lib/ai/report-service.ts` in place of the deterministic template fill, and
restrict hosting access to authorized personnel. See `docs/GAP_ANALYSIS.md`
for the full list of work remaining beyond this session's Phase 1.
