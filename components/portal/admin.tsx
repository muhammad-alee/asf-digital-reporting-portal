"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormField, ReportTemplate, ReportType } from "@/lib/reports/report-types";

type AdminReportType = ReportType & { fields: FormField[]; templates: ReportTemplate[] };
type Props = { notify: (message: string) => void; onTypesChanged: () => void };

export function Admin({ notify, onTypesChanged }: Props) {
  const [types, setTypes] = useState<AdminReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/report-types");
    const data = await response.json();
    if (response.ok) {
      setTypes(data);
      setSelectedId(prev => prev ?? data[0]?.id ?? null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    // react-hooks/set-state-in-effect flags this standard fetch-on-mount
    // pattern; the `ignore` guard already prevents the post-unmount setState
    // it warns about.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [load]);

  async function reload() {
    await load();
    onTypesChanged();
  }

  async function createType() {
    if (!newCode.trim() || !newName.trim()) {
      notify("Enter both a code and a name for the new report type.");
      return;
    }
    const response = await fetch("/api/admin/report-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: newCode, name: newName }) });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Unable to create the report type.");
      return;
    }
    notify(`Report type "${newName}" created.`);
    setNewCode("");
    setNewName("");
    setSelectedId(data.id);
    await reload();
  }

  const selected = types.find(t => t.id === selectedId) ?? null;

  if (loading) return <section className="review-card"><p>Loading administration data…</p></section>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="review-card">
        <p className="eyebrow">Administration</p>
        <h2>Report types, form fields and templates</h2>
        <p>Create new report types and publish their fields and templates here — the New Report form and generation service pick up changes immediately, no code change or migration required.</p>
        <div className="field-row">
          <label className="field"><span>Code</span><input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. VIP_MOVEMENT" /></label>
          <label className="field"><span>Name</span><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. VIP / Official Movement" /></label>
        </div>
        <div className="button-row">
          <button className="primary" onClick={createType}>Create report type</button>
        </div>
      </section>

      <section className="table-wrap">
        <table>
          <thead>
            <tr><th>Code</th><th>Name</th><th>Status</th><th>Fields</th><th>Active version</th></tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id} onClick={() => setSelectedId(t.id)} style={{ cursor: "pointer", background: t.id === selectedId ? "#f5f8f8" : undefined }}>
                <td><strong>{t.code}</strong></td>
                <td>{t.name}</td>
                <td>{t.active ? "Active" : "Inactive"}</td>
                <td>{t.fields.length}</td>
                <td>{t.templates.find(v => v.status === "active")?.version ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && <TypeDetail key={selected.id} type={selected} notify={notify} onChanged={reload} />}
    </div>
  );
}

function TypeDetail({ type, notify, onChanged }: { type: AdminReportType; notify: (message: string) => void; onChanged: () => Promise<void> }) {
  const activeTemplate = type.templates.find(t => t.status === "active") ?? type.templates[0];
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldRequired, setFieldRequired] = useState(true);
  const [subjectPattern, setSubjectPattern] = useState(activeTemplate?.subjectPattern ?? "");
  const [templateBody, setTemplateBody] = useState(activeTemplate?.templateBody ?? defaultTemplateBody);
  const [requiredFields, setRequiredFields] = useState((activeTemplate?.requiredFields as string[] | undefined)?.join(", ") ?? "");

  async function addField() {
    if (!fieldKey.trim() || !fieldLabel.trim()) {
      notify("Enter both a field key and a label.");
      return;
    }
    const response = await fetch(`/api/admin/report-types/${type.id}/fields`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fieldKey, label: fieldLabel, required: fieldRequired }) });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Unable to add the field.");
      return;
    }
    setFieldKey("");
    setFieldLabel("");
    notify(`Field "${fieldLabel}" added to ${type.name}.`);
    await onChanged();
  }

  async function removeField(id: string, label: string) {
    const response = await fetch(`/api/admin/fields/${id}`, { method: "DELETE" });
    if (!response.ok) {
      notify("Unable to remove that field.");
      return;
    }
    notify(`Field "${label}" removed.`);
    await onChanged();
  }

  async function publishTemplate() {
    if (!subjectPattern.trim() || !templateBody.trim()) {
      notify("Enter both a subject pattern and a template body.");
      return;
    }
    const response = await fetch(`/api/admin/report-types/${type.id}/templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectPattern, templateBody, requiredFields }) });
    const data = await response.json();
    if (!response.ok) {
      notify(data.error ?? "Unable to publish the template.");
      return;
    }
    notify(`Template version ${data.version} published for ${type.name}.`);
    await onChanged();
  }

  return (
    <section className="review-card">
      <p className="eyebrow">{type.code}</p>
      <h2>{type.name}</h2>

      <h3 style={{ marginTop: 20 }}>Fields</h3>
      <div className="table-wrap" style={{ marginBottom: 14 }}>
        <table>
          <thead><tr><th>Key</th><th>Label</th><th>Required</th><th></th></tr></thead>
          <tbody>
            {type.fields.length === 0 && <tr><td colSpan={4}>No fields yet.</td></tr>}
            {type.fields.map(f => (
              <tr key={f.id}>
                <td><code>{f.fieldKey}</code></td>
                <td>{f.label}</td>
                <td>{f.required ? "Yes" : "No"}</td>
                <td><button className="secondary" onClick={() => removeField(f.id, f.label)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="field-row">
        <label className="field"><span>Field key</span><input value={fieldKey} onChange={e => setFieldKey(e.target.value)} placeholder="e.g. handover_notes" /></label>
        <label className="field"><span>Label</span><input value={fieldLabel} onChange={e => setFieldLabel(e.target.value)} placeholder="e.g. Handover notes" /></label>
        <label className="field"><span>Required</span>
          <select value={fieldRequired ? "yes" : "no"} onChange={e => setFieldRequired(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <div className="button-row"><button className="secondary" onClick={addField}>Add field</button></div>

      <h3 style={{ marginTop: 24 }}>Template {activeTemplate ? `(current: version ${activeTemplate.version})` : "(none published yet)"}</h3>
      <label className="field"><span>Subject pattern</span><input value={subjectPattern} onChange={e => setSubjectPattern(e.target.value)} placeholder="e.g. VIP Movement Handled" /></label>
      <label className="field"><span>Template body ({"{{airport}} {{subject}} {{date}} {{details}}"} placeholders supported)</span>
        <textarea rows={6} value={templateBody} onChange={e => setTemplateBody(e.target.value)} />
      </label>
      <label className="field"><span>Required fields (comma-separated field keys)</span><input value={requiredFields} onChange={e => setRequiredFields(e.target.value)} placeholder="e.g. handover_notes" /></label>
      <div className="button-row"><button className="primary" onClick={publishTemplate}>Publish new version</button></div>
    </section>
  );
}

const defaultTemplateBody = `ASF {{airport}}

Assalam-O-Alaikum Sir,

Sub: {{subject}}

Dated: {{date}}

◼️ Details:
{{details}}

FIP`;
