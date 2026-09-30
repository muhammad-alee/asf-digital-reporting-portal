"use client";

import "@/app/portal.css";

import { useCallback, useState } from "react";
import { Bell, ClipboardCheck, FilePlus2, FileText, LayoutDashboard, Search, Settings, ShieldCheck, Users } from "lucide-react";
import type { Actor, Airport, Report, ReportTypeWithFields, Unit } from "./types";
import { ReportEditor } from "./report-editor";
import { History } from "./history";
import { Review } from "./review";
import { Admin } from "./admin";

type View = "dashboard" | "new" | "history" | "review" | "incidents" | "admin";

type Props = {
  actor: Actor;
  reportTypes: ReportTypeWithFields[];
  airports: Airport[];
  units: Unit[];
  initialReports: Report[];
};

const ROLE_LABELS: Record<Actor["role"], string> = {
  DATA_ENTRY: "Data Entry",
  SUPERVISOR: "Supervisor",
  REPORT_OFFICER: "Report Officer",
  COMMANDER: "Commander",
  ADMIN: "Administrator",
  AUDITOR: "Auditor",
};

export function PortalApp({ actor, reportTypes: initialReportTypes, airports, units, initialReports }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [notice, setNotice] = useState("");
  const [reports, setReports] = useState(initialReports);
  const [reportTypes, setReportTypes] = useState(initialReportTypes);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 6000);
  }, []);

  const refreshReports = useCallback(async () => {
    const response = await fetch("/api/reports");
    if (response.ok) setReports(await response.json());
  }, []);

  const refreshReportTypes = useCallback(async () => {
    const response = await fetch("/api/report-types");
    if (response.ok) setReportTypes(await response.json());
  }, []);

  const isAdmin = actor.role === "ADMIN";
  const nav: [View, string, typeof LayoutDashboard][] = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["new", "New report", FilePlus2],
    ["history", "Report history", FileText],
    ["review", "Review queue", ClipboardCheck],
    ["incidents", "Incidents", Users],
    ...(isAdmin ? ([["admin", "Administration", Settings]] as [View, string, typeof LayoutDashboard][]) : []),
  ];

  return (
    <main className="portal-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ASF</span>
          <div><strong>Digital Reporting</strong><small>Operational Portal</small></div>
        </div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <span>Secure operational system<br /><small>All actions are audited</small></span>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{ROLE_LABELS[actor.role]}</p>
            <h1>{view === "dashboard" ? `Good day, ${actor.displayName}` : title(view)}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search"><Search size={19} /></button>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <button className="user-button">{initials(actor.displayName)}</button>
          </div>
        </header>
        <div className="content">
          {notice && <p className="notice" role="status">{notice}</p>}
          {view === "dashboard" && <Dashboard reports={reports} reportTypes={reportTypes} airports={airports} go={setView} />}
          {view === "new" && (
            <ReportEditor
              reportTypes={reportTypes}
              airports={airports}
              units={units}
              defaultAirportId={actor.airportId}
              defaultUnitId={null}
              notify={notify}
              onSubmitted={() => { refreshReports(); setView("history"); }}
            />
          )}
          {view === "history" && <History reports={reports} reportTypes={reportTypes} airports={airports} />}
          {view === "review" && <Review reportTypes={reportTypes} airports={airports} notify={notify} onChanged={refreshReports} />}
          {view === "incidents" && <Incidents />}
          {view === "admin" && isAdmin && <Admin notify={notify} onTypesChanged={refreshReportTypes} />}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ reports, reportTypes, airports, go }: { reports: Report[]; reportTypes: ReportTypeWithFields[]; airports: Airport[]; go: (view: View) => void }) {
  const today = new Date().toDateString();
  const todayCount = reports.filter(r => new Date(r.createdAt).toDateString() === today).length;
  const pending = reports.filter(r => r.status === "PENDING_REVIEW").length;
  const approved = reports.filter(r => r.status === "APPROVED" || r.status === "FINALIZED").length;
  const drafts = reports.filter(r => r.status === "DRAFT" || r.status === "RETURNED").length;

  return (
    <>
      <section className="summary-grid">
        <Metric label="Reports today" value={String(todayCount)} detail={`${reports.length} total visible`} tone="blue" />
        <Metric label="Pending review" value={String(pending)} detail="Awaiting a decision" tone="amber" />
        <Metric label="Approved" value={String(approved)} detail="Approved or finalized" tone="green" />
        <Metric label="Drafts" value={String(drafts)} detail="Draft or returned" tone="slate" />
      </section>
      <section className="section-head">
        <div>
          <h2>Operational reporting</h2>
          <p>Create, validate, review and finalize factual reports.</p>
        </div>
        <button className="primary" onClick={() => go("new")}><FilePlus2 size={17} /> New report</button>
      </section>
      <History reports={reports} reportTypes={reportTypes} airports={airports} />
    </>
  );
}

function Incidents() {
  return (
    <section className="review-card">
      <p className="eyebrow">Incident management</p>
      <h2>Message grouping and duplicate detection</h2>
      <p>Not yet implemented — tracked as Phase 5 in <code>docs/GAP_ANALYSIS.md</code>. Raw messages will be associated with incidents using airport, time, flight, location, person and vehicle facts, with possible duplicates surfaced as warnings for human review.</p>
    </section>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`metric ${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

function title(v: View) {
  return ({ new: "New report", history: "Report history", review: "Supervisor review", incidents: "Incidents", admin: "Administration", dashboard: "Dashboard" } as const)[v];
}
