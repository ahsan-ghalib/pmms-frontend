"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { toast } from "sonner";

const blank = () => ({ name: "", description: "", is_active: true, levels: [1, 2, 3].map((level) => ({ level, enabled: true, label: level === 1 ? "Location" : level === 2 ? "Sub-Location" : "Unit", plural_label: "", is_required: level > 0 })) });

export default function PropertyTypesPage() {
  const [rows, setRows] = useState([]); const [form, setForm] = useState(blank()); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(false);
  const load = () => { platformApi.propertyTypes().then(setRows).catch((error) => toast.error(apiError(error, "Unable to load property types"))); };
  useEffect(() => { load(); }, []);
  const save = async (event) => { event.preventDefault(); setLoading(true); try { if (editing) await platformApi.updatePropertyType(editing, form); else await platformApi.createPropertyType(form); toast.success("Property type saved"); setForm(blank()); setEditing(null); load(); } catch (error) { toast.error(apiError(error, "Unable to save property type")); } finally { setLoading(false); } };
  const edit = (row) => { setEditing(row.id); setForm({ name: row.name, description: row.description || "", is_active: row.is_active, levels: row.levels.map((level) => ({ level: level.level, enabled: level.enabled, label: level.label, plural_label: level.plural_label || "", is_required: level.is_required })) }); };
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Property Types</h1><p className="text-sm text-slate-500">Configure the master hierarchy labels used by Company Admins.</p></div><form onSubmit={save} className="glass-panel space-y-4 rounded-2xl p-6"><div className="grid gap-4 md:grid-cols-2"><Input placeholder="Property type name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>{form.levels.map((level, index) => <div key={level.level} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[100px_1fr_1fr_auto]"><span className="self-center font-medium">Level {level.level}</span><Input placeholder="Label" value={level.label} onChange={(e) => setForm({ ...form, levels: form.levels.map((item, i) => i === index ? { ...item, label: e.target.value } : item) })} required /><Input placeholder="Plural label" value={level.plural_label} onChange={(e) => setForm({ ...form, levels: form.levels.map((item, i) => i === index ? { ...item, plural_label: e.target.value } : item) })} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={level.enabled} onChange={(e) => setForm({ ...form, levels: form.levels.map((item, i) => i === index ? { ...item, enabled: e.target.checked } : item) })} /> Enabled</label></div>)}<div className="flex gap-2"><Button disabled={loading}>{editing ? "Save changes" : "Create property type"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm(blank()); }}>Cancel</Button>}</div></form><div className="grid gap-3">{rows.map((row) => <div key={row.id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-semibold">{row.name}</p><p className="text-sm text-slate-500">{row.levels.filter((level) => level.enabled).map((level) => level.label).join(" → ")}</p></div><Button variant="outline" onClick={() => edit(row)}>Edit</Button></div>)}</div></div>;
}
