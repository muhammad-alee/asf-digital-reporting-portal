"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { AIReportResult, Airport, ReportTypeWithFields, Unit, ValidationResult } from "./types";

type Props = {
  reportTypes: ReportTypeWithFields[];
  airports: Airport[];
  units: Unit[];
  defaultAirportId: string | null;
  defaultUnitId: string | null;
  notify: (message: string) => void;
  onSubmitted: () => void;
};

export function ReportEditor({ reportTypes, airports, units, defaultAirportId, defaultUnitId, notify, onSubmitted }: Props) {
  const [typeId, setTypeId] = useState(reportTypes[0]?.id ?? "");
  const [airportId, setAirportId] = useState(defaultAirportId ?? airports[0]?.id ?? "");
  const [unitId, setUnitId] = useState(defaultUnitId ?? "");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportTime, setReportTime] = useState("");
  const [shift, setShift] = useState("Morning");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [aiResult, setAiResult] = useState<AIReportResult | null>(null);
  const [busy, setBusy] = useState<"save" | "generate" | "submit" | null>(null);

  const type = useMemo(() => reportTypes.find(t => t.id === typeId) ?? reportTypes[0], [reportTypes, typeId]);

  function selectType(id: string) {
    setTypeId(id);
    setFields({});
    setDraftId(null);
    setAiResult(null);
    setValidation(null);
  }

  async function saveDraft(): Promise<string | null> {
    setBusy("save");
    try {
      const payload = {
        airportId,
        unitId: unitId || null,
        reportTypeId: type?.id,
        reportDate,
        reportTime: reportTime || null,
        shift: shift || null,
        location: location || null,
        source,
        structuredData: fields,
        requiredFields: type?.template?.requiredFields ?? [],
      };
      const response = draftId
        ? await fetch(`/api/reports/${draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) {
        notify(data.error ?? "Unable to save the draft.");
        return null;
      }
      setValidation(data.validation);
      const id = draftId ?? data.id;
      setDraftId(id);
      notify("Draft saved. It remains editable before submission.");
      return id;
    } finally {
      setBusy(null);
    }
  }

  async function generateDraft() {
    setBusy("generate");
    try {
      const id = draftId ?? (await saveDraft());
      if (!id) return;
      const response = await fetch(`/api/reports/${id}/generate`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        notify(data.error ?? "Unable to generate the draft.");
        return;
      }
      setAiResult(data.result);
      setValidation({ missingFields: data.result.missing_fields, contradictions: data.result.contradictions, warnings: data.result.warnings });
      notify("Draft generated. Verify every fact before submitting.");
    } finally {
      setBusy(null);
    }
  }

  async function submitForReview() {
    if (!draftId) {
      notify("Generate a draft before submitting.");
      return;
    }
    setBusy("submit");
    try {
      const response = await fetch(`/api/reports/${draftId}/workflow`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "SUBMIT" }) });
      const data = await response.json();
      if (!response.ok) {
        notify(data.error ?? "Unable to submit the report.");
        return;
      }
      notify("Report submitted to the supervisor review queue.");
      setDraftId(null);
      setAiResult(null);
      setValidation(null);
      setFields({});
      setSource("");
      onSubmitted();
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="section-head">
        <div>
          <h2>Create operational report</h2>
          <p>Source material remains the authority. AI drafts require human review.</p>
        </div>
        <span className="draft-pill">● {draftId ? "Draft saved" : "Unsaved"}</span>
      </section>
      <section className="composer">
        <div className="form-panel">
          <div className="field-row">
            <label className="field">
              <span>Airport</span>
              <select value={airportId} onChange={e => setAirportId(e.target.value)}>
                {airports.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Unit</span>
              <select value={unitId} onChange={e => setUnitId(e.target.value)}>
                <option value="">Unassigned</option>
                {units.filter(u => u.airportId === airportId).map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Report date</span>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Time</span>
              <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} />
            </label>
            <label className="field">
              <span>Shift</span>
              <select value={shift} onChange={e => setShift(e.target.value)}>
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </label>
            <label className="field">
              <span>Location</span>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Landside car park" />
            </label>
          </div>
          <label className="field">
            <span>Report type</span>
            <select value={type?.id ?? ""} onChange={e => selectType(e.target.value)}>
              {reportTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <div className="dynamic">
            <span>Required facts for {type?.name}</span>
            <div>
              {(type?.fields ?? []).map(field => (
                <label key={field.id}>
                  <small>{field.label}</small>
                  <input
                    value={fields[field.fieldKey] ?? ""}
                    onChange={e => setFields(prev => ({ ...prev, [field.fieldKey]: e.target.value }))}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </label>
              ))}
            </div>
          </div>
          <label className="field">
            <span>Source messages / notes</span>
            <textarea rows={6} value={source} onChange={e => setSource(e.target.value)} />
          </label>
          <div className="composer-actions">
            <button className="secondary" disabled={busy !== null} onClick={saveDraft}>Save draft</button>
            <button className="primary" disabled={busy !== null} onClick={generateDraft}>
              <Sparkles size={17} /> Generate AI draft
            </button>
          </div>
        </div>
        <div className="preview-panel">
          <div className="preview-head">
            <div>
              <p className="eyebrow">Official report preview</p>
              <h3>{aiResult ? "AI draft ready" : "Awaiting generation"}</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          {aiResult ? (
            <>
              <ValidationWarnings validation={validation} />
              <pre>{aiResult.generated_report}</pre>
              <div className="preview-footer">
                <span>Classification: {aiResult.classification}</span>
                <div className="button-row">
                  <button className="secondary" onClick={() => { navigator.clipboard.writeText(aiResult.generated_report); notify("Draft copied to clipboard."); }}>Copy</button>
                  <button className="primary" disabled={busy !== null} onClick={submitForReview}>Submit for review</button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-preview">
              <Sparkles size={28} />
              <strong>Formal report preview</strong>
              <p>Generate a draft after entering verified source information.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ValidationWarnings({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return null;
  const items = [
    ...validation.missingFields.map(f => `Missing: ${f}`),
    ...validation.contradictions,
    ...validation.warnings,
  ];
  if (items.length === 0) {
    return (
      <div className="warning">
        <ShieldCheck size={17} />
        <span>No missing fields or contradictions detected.</span>
      </div>
    );
  }
  return (
    <div className="warning">
      <TriangleAlert size={17} />
      <span>{items.join(" · ")}</span>
    </div>
  );
}
