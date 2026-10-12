"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { checklistsApi } from "@/services/checklists/checklists-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, formatDate } from "@/lib/pmms";
import { getGps } from "@/lib/geo";
import { useT } from "@/lib/use-t";

export default function ChecklistsPage() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [properties, setProperties] = useState([]);
  const [start, setStart] = useState({ template_id: "", property_id: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [executions, list, mine] = await Promise.all([
        checklistsApi.executions(),
        checklistsApi.templates({ status: "active" }),
        checklistsApi.templates({ status: "active", assigned_to_me: 1 }),
      ]);
      setRows(Array.isArray(executions) ? executions : []);
      setTemplates(Array.isArray(list) ? list : []);
      setAssigned(Array.isArray(mine) ? mine : []);
    } catch (error) {
      toast.error(apiError(error, t("checklist_load_failed", { defaultMessage: "Failed to load checklists" })));
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const chosen = templates.find((row) => row.id === start.template_id);
  const propertyOptions = chosen?.properties?.length ? chosen.properties : properties;

  const choose = (templateId) => {
    const template = templates.find((row) => row.id === templateId);
    setStart({
      template_id: templateId,
      property_id: template?.properties?.length === 1 ? String(template.properties[0].id) : "",
    });
  };

  const begin = async () => {
    setBusy(true);
    try {
      const gps = await getGps();
      const execution = await checklistsApi.start({
        template_id: start.template_id,
        property_id: start.property_id || undefined,
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy_meters: gps.accuracy_meters,
      });
      toast.success(t("checklist_started", { defaultMessage: "GPS verified. Checklist started." }));
      router.push(`/checklists/${execution.id}`);
    } catch (error) {
      toast.error(apiError(error, error?.message || t("checklist_start_failed", { defaultMessage: "Unable to start checklist. GPS at the site is required." })));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title={t("daily_checklists", { defaultMessage: "Daily inspection checklists" })}
        description={t("daily_checklists_desc", { defaultMessage: "Supervisors and technicians start a checklist only after GPS verification at the property." })}
      />
      {assigned.length > 0 && (
        <section className="glass-panel space-y-3 rounded-2xl p-5">
          <h3 className="font-semibold">{t("assigned_to_me", { defaultMessage: "Assigned to me" })}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {assigned.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`rounded-xl border p-3 text-start text-sm ${start.template_id === row.id ? "border-violet-500 bg-violet-50" : ""}`}
                onClick={() => choose(row.id)}
              >
                <span className="font-medium">{row.name}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {row.property_name || t("all_properties", { defaultMessage: "All properties" })} · {row.active_item_count} {t("active_items", { defaultMessage: "active items" })}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("checklist", { defaultMessage: "Checklist" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={start.template_id} onChange={(event) => choose(event.target.value)}>
            <option value="">{t("select", { defaultMessage: "Select" })}</option>
            {templates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("property", { defaultMessage: "Property" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={start.property_id} onChange={(event) => setStart((current) => ({ ...current, property_id: event.target.value }))}>
            <option value="">{t("select", { defaultMessage: "Select" })}</option>
            {propertyOptions.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <Button className="bg-violet-600 hover:bg-violet-700" disabled={busy || !start.template_id || !start.property_id} onClick={begin}>
            {t("start_with_gps", { defaultMessage: "Verify GPS and start" })}
          </Button>
        </div>
      </section>
      <div className="space-y-2">
        {rows.map((row) => (
          <button key={row.id} type="button" className="glass-panel flex w-full justify-between rounded-2xl p-4 text-start" onClick={() => router.push(`/checklists/${row.id}`)}>
            <span>
              <span className="font-semibold">{row.template_name}</span>
              <span className="mt-1 block text-sm text-slate-500">{row.property_name} · {row.performer_name} · {formatDate(row.started_at)}</span>
            </span>
            <StatusBadge value={row.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
