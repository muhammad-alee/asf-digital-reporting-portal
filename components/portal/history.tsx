"use client";

import type { Airport, Report, ReportTypeWithFields } from "./types";
import { formatDateTime, statusLabel, statusSlug } from "./format";

type Props = { reports: Report[]; reportTypes: ReportTypeWithFields[]; airports: Airport[] };

export function History({ reports, reportTypes, airports }: Props) {
  const typeName = (id: string) => reportTypes.find(t => t.id === id)?.name ?? "—";
  const airportName = (id: string) => airports.find(a => a.id === id)?.name ?? "—";

  return (
    <section className="recent-section">
      <div className="section-head">
        <div>
          <h2>Recent reports</h2>
          <p>Latest activity across assigned airports and units.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Report number</th>
              <th>Type</th>
              <th>Airport</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={5}>No reports yet.</td>
              </tr>
            )}
            {reports.map(r => (
              <tr key={r.id}>
                <td><strong>{r.reportNumber}</strong></td>
                <td>{typeName(r.reportTypeId)}</td>
                <td>{airportName(r.airportId)}</td>
                <td><span className={`status ${statusSlug(r.status)}`}>{statusLabel(r.status)}</span></td>
                <td>{formatDateTime(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
