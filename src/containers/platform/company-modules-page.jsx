"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { companiesApi } from "@/services/companies/companies-api";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { toast } from "sonner";

export default function CompanyModulesPage() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {}); }, []);
  useEffect(() => { if (companyId) platformApi.companyModules(companyId).then(setModules).catch((error) => toast.error(apiError(error, "Unable to load modules"))); else setModules([]); }, [companyId]);
  const save = async () => { setSaving(true); try { await platformApi.updateCompanyModules(companyId, modules.map((module) => ({ module_id: module.id, is_enabled: module.is_enabled }))); toast.success("Modules updated"); } catch (error) { toast.error(apiError(error, "Unable to update modules")); } finally { setSaving(false); } };

  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Modules</h1><p className="text-sm text-muted-foreground">Enable or disable modules for each company.</p></div><div className="glass-panel rounded-2xl p-5"><label className="block text-sm font-medium">Company<select className="mt-2 h-10 w-full rounded-md border bg-transparent px-3 text-sm" value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label></div>{companyId && <div className="glass-panel space-y-3 rounded-2xl p-5"><div className="grid gap-2 md:grid-cols-2">{modules.map((module) => <div key={module.id} className="flex items-center justify-between rounded-xl border px-4 py-3"><div><p className="font-medium">{module.name}</p>{module.name_ar && <p className="text-xs text-muted-foreground">{module.name_ar}</p>}</div><Switch checked={module.is_enabled} onCheckedChange={(checked) => setModules((current) => current.map((item) => item.id === module.id ? { ...item, is_enabled: checked } : item))} /></div>)}</div><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>}</div>;
}
