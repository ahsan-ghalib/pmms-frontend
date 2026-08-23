"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { slaApi } from "@/services/sla/sla-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const EMPTY = {
  category_id: "",
  service_id: "",
  priority: "",
  response_target_minutes: 60,
  arrival_target_minutes: 120,
  resolution_target_minutes: 480,
  risk_threshold_percent: 80,
  use_business_hours: false,
  is_active: true,
  effective_from: "",
  effective_to: "",
  escalate_at_risk: true,
  escalate_breached: true,
};

export default function SlaPoliciesPage() {
  const t = useT("common");
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const data = await slaApi.policies();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("sla_load_failed", { defaultMessage: "Failed to load SLA policies" })));
    }
  };

  useEffect(() => {
    load();
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const services = useMemo(
    () => categories.find((row) => row.id === form.category_id)?.services || [],
    [categories, form.category_id]
  );

  const save = async () => {
    const payload = {
      category_id: form.category_id || null,
      service_id: form.service_id || null,
      priority: form.priority || null,
      response_target_minutes: Number(form.response_target_minutes),
      arrival_target_minutes: Number(form.arrival_target_minutes),
      resolution_target_minutes: Number(form.resolution_target_minutes),
      risk_threshold_percent: Number(form.risk_threshold_percent),
      business_calendar: { use_business_hours: Boolean(form.use_business_hours) },
      is_active: Boolean(form.is_active),
      effective_from: form.effective_from || null,
      effective_to: form.effective_to || null,
      escalation_rules: [
        form.escalate_at_risk && { trigger_type: "at_risk", recipient_type: "supervisor" },
        form.escalate_breached && { trigger_type: "breached", recipient_type: "company-admin" },
      ].filter(Boolean),
    };

    try {
      if (editing) {
        await slaApi.updatePolicy(editing, payload);
        toast.success(t("sla_updated", { defaultMessage: "SLA policy updated" }));
      } else {
        await slaApi.createPolicy(payload);
        toast.success(t("sla_created", { defaultMessage: "SLA policy created" }));
      }
      setForm(EMPTY);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("sla_save_failed", { defaultMessage: "Unable to save SLA policy" })));
    }
  };

  const edit = (row) => {
    setEditing(row.id);
    setForm({
      category_id: row.category_id || "",
      service_id: row.service_id || "",
      priority: row.priority || "",
      response_target_minutes: row.response_target_minutes,
      arrival_target_minutes: row.arrival_target_minutes,
      resolution_target_minutes: row.resolution_target_minutes,
      risk_threshold_percent: row.risk_threshold_percent,
      use_business_hours: Boolean(row.business_calendar?.use_business_hours),
      is_active: row.is_active,
      effective_from: row.effective_from || "",
      effective_to: row.effective_to || "",
      escalate_at_risk: (row.escalation_rules || []).some((rule) => rule.trigger_type === "at_risk"),
      escalate_breached: (row.escalation_rules || []).some((rule) => rule.trigger_type === "breached"),
    });
  };

  const stats = {
    total: rows.length,
    active: rows.filter((row) => row.is_active).length,
    calendar: rows.filter((row) => row.business_calendar?.use_business_hours).length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Timer}
        title={t("sla_policies", { defaultMessage: "SLA policies" })}
        description={t("sla_policies_desc", { defaultMessage: "Response, on-site arrival, and resolution targets by category, service, and priority." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("policies", { defaultMessage: "Policies" })} value={stats.total} theme="indigo" icon={Timer} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Timer} />
        <StatCard title={t("business_calendar", { defaultMessage: "Business calendar" })} value={stats.calendar} theme="violet" icon={Timer} />
      </div>

      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-4">
        <select className="h-10 rounded-md border px-3 text-sm" value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value, service_id: "" }))}>
          <option value="">{t("all_categories", { defaultMessage: "All categories" })}</option>
          {categories.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.service_id} onChange={(event) => setForm((current) => ({ ...current, service_id: event.target.value }))}>
          <option value="">{t("all_services", { defaultMessage: "All services" })}</option>
          {services.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
          <option value="">{t("all_priorities", { defaultMessage: "All priorities" })}</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.use_business_hours} onChange={(event) => setForm((current) => ({ ...current, use_business_hours: event.target.checked }))} />
          {t("use_business_hours", { defaultMessage: "Use business calendar" })}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
          {t("active", { defaultMessage: "Active" })}
        </label>
        <Input type="number" min="1" value={form.response_target_minutes} onChange={(event) => setForm((current) => ({ ...current, response_target_minutes: event.target.value }))} placeholder="Response minutes" />
        <Input type="number" min="1" value={form.arrival_target_minutes} onChange={(event) => setForm((current) => ({ ...current, arrival_target_minutes: event.target.value }))} placeholder="Arrival minutes" />
        <Input type="number" min="1" value={form.resolution_target_minutes} onChange={(event) => setForm((current) => ({ ...current, resolution_target_minutes: event.target.value }))} placeholder="Resolution minutes" />
        <Input type="number" min="1" max="99" value={form.risk_threshold_percent} onChange={(event) => setForm((current) => ({ ...current, risk_threshold_percent: event.target.value }))} placeholder="At-risk %" />
        <Input type="date" value={form.effective_from} onChange={(event) => setForm((current) => ({ ...current, effective_from: event.target.value }))} />
        <Input type="date" value={form.effective_to} onChange={(event) => setForm((current) => ({ ...current, effective_to: event.target.value }))} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.escalate_at_risk} onChange={(event) => setForm((current) => ({ ...current, escalate_at_risk: event.target.checked }))} />
          {t("alert_at_risk", { defaultMessage: "Alert supervisors at risk" })}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.escalate_breached} onChange={(event) => setForm((current) => ({ ...current, escalate_breached: event.target.checked }))} />
          {t("alert_breached", { defaultMessage: "Alert admins on breach" })}
        </label>
        <div className="md:col-span-4 flex justify-end">
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={save}>
            <Plus className="mr-2 h-4 w-4" />
            {editing ? t("save", { defaultMessage: "Save" }) : t("add_policy", { defaultMessage: "Add policy" })}
          </Button>
        </div>
      </section>

      <div className="space-y-3">
        {rows.map((row) => (
          <button key={row.id} type="button" onClick={() => edit(row)} className="glass-panel flex w-full items-center justify-between rounded-2xl p-4 text-left">
            <div>
              <p className="font-semibold">{row.category_name || t("all_categories", { defaultMessage: "All categories" })} · {row.service_name || t("all_services", { defaultMessage: "All services" })}</p>
              <p className="text-sm text-slate-500">
                {labelize(row.priority || "any")} · response {row.response_target_minutes}m · arrival {row.arrival_target_minutes}m · resolution {row.resolution_target_minutes}m · risk {row.risk_threshold_percent}%
              </p>
            </div>
            <div className="flex items-center gap-2">
              {row.business_calendar?.use_business_hours && <StatusBadge value="business calendar" />}
              <StatusBadge value={row.is_active ? "active" : "inactive"} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
