# ASF Digital Reporting Portal — User Guide

A walkthrough of every screen in the portal for people testing the build.
For a nicer-to-read, illustrated version of this same content, see the
published artifact version (ask whoever shared the test link, or regenerate
from this file).

All data in the current build is **fictional test data**. Do not enter real
names, passport numbers, or recovery details while testing.

## Before you start

**Signing in.** Open the test link. The portal signs you in automatically —
there's no password. You land on the Dashboard as **Demo Administrator**.

> **One shared login.** This test build has a single login only — everyone
> who opens the link signs in as the *same* Demo Administrator account, and
> can see and act on each other's test reports. That's expected for now,
> not a bug; separate logins arrive with real authentication (tracked in
> `docs/GAP_ANALYSIS.md`).

**The main screens**, via the left sidebar: Dashboard, New report, Report
history, Review queue, Incidents (not yet built), and — only for this
shared admin login — Administration.

## The dashboard

Four tiles, counting what's visible to you right now: Reports today,
Pending review, Approved, Drafts. Below them is the same recent-reports
table as Report History. Click **New report** to start one.

## Creating a report

Open **New report**.

1. Fill in **Airport**, **Unit** (optional), **Report date**, **Time**,
   **Shift**, and **Location**.
2. Pick a **Report type**. This list is read from the portal's own
   settings, so it isn't fixed — as of writing it includes Snap Checking,
   Ammunition Recovery, Medical Case, Maintenance, and **Other / General
   Activity**. Choosing a type changes the **Required facts** fields below
   it. Fill in what you know; leave the rest blank rather than guessing.
3. Nothing fits? Pick **Other / General Activity** — it asks for one thing,
   a **Subject** line you write yourself, and relies on your notes for the
   rest.
4. Write what actually happened in **Source messages / notes**, the way
   you'd currently type it into WhatsApp. This text is checked for missing
   details/contradictions and carried into the generated report verbatim —
   never discarded.
5. Click **Save draft** any time to store your work. A saved draft gets a
   real report number immediately: `ASF-<AIRPORT>-<YEAR>-<MONTHDAY>-<SEQ>`,
   e.g. `ASF-DEMO-2026-0914-003` — the third report saved for the
   Demonstration Airport on 14 September 2026. You never set this number
   yourself.

## The AI draft

Click **Generate AI draft**.

> **Facts first, always.** The generator never invents a name, quantity,
> date, or outcome you didn't provide. A blank field is written as *"Not
> provided,"* never guessed. This is the system's core rule — generation is
> a formatting/organizing step, not a source of new information.

The banner above the draft tells you what the check found:

| Banner | Meaning |
|---|---|
| "No missing fields or contradictions detected." | All required facts are filled in, nothing conflicts. |
| "Missing: `<field>`" | A required field for this type is empty. |
| "Multiple quantities were found in the source…" | Your notes mention two different numbers for the same thing — the system won't pick one for you. |
| "Source contains both suspected and confirmed language…" | Your notes say something was both suspected and confirmed — check the real status before submitting. |

You can regenerate as many times as you like while the report is a Draft;
each generation reflects your latest input only.

## Submitting & the review queue

Click **Submit for review** once the draft looks right. The report moves:
`Draft → AI draft ready → Pending review → Approved`.

**Reviewing** (Supervisor / Report Officer / Commander): open **Review
queue**. Every report waiting for a decision in your airport appears with
its full generated text.

- **Approve** — correct and complete → status `Approved`.
- **Return** — send back for correction → status `Returned`; can be edited
  and resubmitted.
- **Reject** — should not proceed.

> Return and Reject both **require a written comment** — the button is
> blocked until you type one. Approve doesn't need one.

## Report history

Every report you're allowed to see: report number, type, airport, status,
last updated — most recent first.

## Administration

Only visible with this build's admin login. New report types created here
appear in **New report** immediately — no code change or restart.

1. Enter a **Code** (e.g. `VIP_MOVEMENT`) and **Name** (e.g. "VIP /
   Official Movement"), then **Create report type**.
2. Select it, and under **Fields** add each fact it should ask for — a
   field key like `vip_name` and a label like "VIP name / designation."
3. Under **Template**, write the subject line and report body, then
   **Publish new version**. Publishing never overwrites — it always creates
   a new numbered version and retires the old one, so a report generated
   last week still reflects the template that existed then.

Add a field with the key `custom_subject` to any type and the generator
will use whatever the submitter types there as the `Sub:` line instead of
your fixed subject pattern — this is exactly how "Other / General Activity"
works.

**Template placeholders:** `{{airport}}`, `{{subject}}`, `{{date}}`,
`{{details}}` (every field's label/value plus the submitter's source
notes).

## Roles & permissions

Only Administrator is reachable through the shared test login; this is what
each role is designed to do once real sign-in exists:

| Role | Create & submit | Review queue | Approve | Administration |
|---|---|---|---|---|
| Data Entry | ✓ | — | — | — |
| Supervisor | ✓ | ✓ | ✓ | — |
| Report Officer | ✓ | ✓ | — | — |
| Commander | — | ✓ | ✓ | — |
| Administrator | ✓ | ✓ | ✓ | ✓ |
| Auditor | — | — | — | read-only |

Supervisors/Report Officers see their own airport's queue; Administrators
and Auditors see every airport's.

## Known limitations right now

- **No Finalize step or PDF export yet** — approved reports stay Approved.
- **No incident grouping or duplicate warnings yet.**
- **No file attachments yet.**
- **"Generate AI draft" is a deterministic, rule-based formatter, not a
  live AI model** — reliably safe (it can't hallucinate), but won't
  rephrase or summarize creatively. A real provider is planned behind the
  same button.
- **One shared login** — see above.

## Troubleshooting

- **"Submit for review" is disabled** — generate a draft at least once
  first.
- **Return / Reject won't click** — type a comment first; both require one.
- **Page won't load / server error** — the test server may have restarted;
  wait a few seconds and reload. If it persists, tell whoever set up the
  test — the link only works while their machine keeps it running.
- **No "Administration" tab** — it only shows for the shared admin login;
  reload if it's missing while signed in.
