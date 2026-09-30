"use client";

import { useCallback, useEffect, useState } from "react";
import type { Airport, Report, ReportTypeWithFields } from "./types";

type Props = { reportTypes: ReportTypeWithFields[]; airports: Airport[]; notify: (message: string) => void; onChanged: () => void };
type Action = "RETURN" | "REJECT" | "APPROVE";

export function Review({ reportTypes, airports, notify, onChanged }: Props) {
  const [queue, setQueue] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    const response = await fetch("/api/reports?status=PENDING_REVIEW");
    const data = await response.json();
    setQueue(response.ok ? data : []);
  }, []);

  useEffect(() => {
    let ignore = false;
    // react-hooks/set-state-in-effect flags this standard fetch-on-mount
    // pattern; the `ignore` guard already prevents the post-unmount setState
    // it warns about.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQueue().finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [fetchQueue]);

  function load() {
    setLoading(true);
    fetchQueue().finally(() => setLoading(false));
  }

  async function act(id: string, action: Action, comment: string) {
    if ((action === "RETURN" || action === "REJECT") && !comment.trim()) {
      notify("A comment is required to return or reject a report.");
      return;
    }
    const response = await fetch(`/api/reports/${id}/workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment: comment.trim() || undefined }),
    });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Unable to update this report.");
      return;
    }
    notify(action === "APPROVE" ? "Report approved and ready for finalization." : action === "RETURN" ? "Report returned for correction." : "Report rejected.");
    load();
    onChanged();
  }

  if (loading) return <section className="review-card"><p>Loading review queue…</p></section>;
  if (queue.length === 0) return <section className="review-card"><p className="eyebrow">Pending review</p><h2>Nothing waiting for review</h2><p>Submitted reports for your airport will appear here.</p></section>;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {queue.map(report => (
        <ReviewCard key={report.id} report={report} reportTypes={reportTypes} airports={airports} onAct={act} />
      ))}
    </section>
  );
}

function ReviewCard({ report, reportTypes, airports, onAct }: { report: Report; reportTypes: ReportTypeWithFields[]; airports: Airport[]; onAct: (id: string, action: Action, comment: string) => void }) {
  const [comment, setComment] = useState("");
  const typeName = reportTypes.find(t => t.id === report.reportTypeId)?.name ?? "Report";
  const airportName = airports.find(a => a.id === report.airportId)?.name ?? "";

  return (
    <div className="review-card">
      <p className="eyebrow">Pending review</p>
      <h2>{report.reportNumber} · {typeName}{airportName ? ` · ${airportName}` : ""}</h2>
      <p>Review source facts, structured data, AI warnings and the generated report before making a decision.</p>
      {report.generatedContent && <pre style={{ whiteSpace: "pre-wrap", background: "#f5f8f8", padding: 14, borderRadius: 7, fontSize: 13 }}>{report.generatedContent}</pre>}
      <label className="field">
        <span>Reviewer comments (required for return/reject)</span>
        <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} />
      </label>
      <div className="button-row">
        <button className="secondary" onClick={() => onAct(report.id, "RETURN", comment)}>Return</button>
        <button className="secondary" onClick={() => onAct(report.id, "REJECT", comment)}>Reject</button>
        <button className="primary" onClick={() => onAct(report.id, "APPROVE", comment)}>Approve</button>
      </div>
    </div>
  );
}
