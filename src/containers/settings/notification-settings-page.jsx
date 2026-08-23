"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import { notificationsApi } from "@/services/notifications/notifications-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";

export default function NotificationSettingsPage() {
  const t = useT("common");
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const isSuper = role === Roles.SUPER_ADMIN;
  const [templates, setTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [form, setForm] = useState({ event: "complaint.submitted", language: "en", channel: "push", title: "", body: "" });

  const load = async () => {
    try {
      const data = await notificationsApi.templates(companyId ? { company_id: companyId } : {});
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("templates_failed", { defaultMessage: "Failed to load templates" })));
    }
  };

  useEffect(() => { load(); }, [companyId]);
  useEffect(() => {
    if (!isSuper || !companyId) return;
    companiesApi.show(companyId)
      .then((company) => setEmailEnabled(company?.email_enabled !== false))
      .catch(() => {});
  }, [companyId, isSuper]);
  useEffect(() => {
    if (!isSuper) return;
    companiesApi.list({ per_page: 100 }).then((data) => {
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setCompanies(rows);
    }).catch(() => {});
  }, [isSuper]);

  const save = async () => {
    try {
      await notificationsApi.saveTemplate({ ...form, company_id: companyId || undefined });
      toast.success(t("template_saved", { defaultMessage: "Template saved" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("template_failed", { defaultMessage: "Unable to save template" })));
    }
  };

  const toggleEmail = async () => {
    if (!companyId) {
      toast.error(t("select_company", { defaultMessage: "Select a company first" }));
      return;
    }
    try {
      const data = await notificationsApi.setEmailEnabled(companyId, emailEnabled);
      setEmailEnabled(Boolean(data?.email_enabled));
      toast.success(t("email_updated", { defaultMessage: "Email setting updated" }));
    } catch (error) {
      toast.error(apiError(error, t("email_failed", { defaultMessage: "Only Super Admin can change email delivery" })));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bell}
        title={t("notification_settings", { defaultMessage: "Notification settings" })}
        description={t("notification_settings_desc", { defaultMessage: "English and Arabic templates per event. Disabling email never stops push." })}
      />
      {isSuper && (
        <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("company", { defaultMessage: "Company" })}</span>
            <select className="h-10 w-full rounded-md border px-3 text-sm" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
              <option value="">{t("platform_defaults", { defaultMessage: "Platform defaults" })}</option>
              {companies.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input type="checkbox" checked={emailEnabled} onChange={(event) => setEmailEnabled(event.target.checked)} />
            {t("email_enabled", { defaultMessage: "Email notifications enabled" })}
          </label>
          <div className="flex items-end">
            <Button variant="outline" onClick={toggleEmail}>{t("save_email", { defaultMessage: "Save email setting" })}</Button>
          </div>
        </section>
      )}
      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("event", { defaultMessage: "Event" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.event} onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))}>
            {["complaint.submitted", "complaint.assigned", "complaint.in_progress", "complaint.on_hold", "complaint.completed", "complaint.verified", "complaint.closed", "sla.at_risk", "sla.breached", "broadcast"].map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("language", { defaultMessage: "Language" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("channel", { defaultMessage: "Channel" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}>
            <option value="push">Push</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("title", { defaultMessage: "Title" })}</span>
          <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("body", { defaultMessage: "Body" })}</span>
          <textarea className="min-h-24 w-full rounded-md border p-3 text-sm" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={save}>{t("save_template", { defaultMessage: "Save template" })}</Button>
        </div>
      </section>
      <div className="space-y-2">
        {templates.map((row) => (
          <button key={row.id} type="button" className="glass-panel flex w-full justify-between rounded-2xl p-4 text-start" onClick={() => setForm({ event: row.event, language: row.language, channel: row.channel, title: row.title, body: row.body })}>
            <span className="font-semibold">{row.event} · {row.language} · {row.channel}</span>
            <span className="text-sm text-slate-500">{row.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
