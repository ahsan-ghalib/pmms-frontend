"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { notificationsApi } from "@/services/notifications/notifications-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const EMPTY = { audience: "all", language: "en", body: "", send_at: "" };

export default function BroadcastsPage() {
  const t = useT("common");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    try {
      const data = await notificationsApi.broadcasts();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("broadcasts_failed", { defaultMessage: "Failed to load broadcasts" })));
    }
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    try {
      await notificationsApi.createBroadcast({
        audience: form.audience,
        language: form.language,
        body: form.body,
        send_at: form.send_at || undefined,
      });
      toast.success(t("broadcast_saved", { defaultMessage: "Broadcast saved" }));
      setForm(EMPTY);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("broadcast_failed", { defaultMessage: "Unable to send broadcast" })));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Megaphone}
        title={t("broadcasts", { defaultMessage: "Broadcasts" })}
        description={t("broadcasts_desc", { defaultMessage: "Text-only messages to all users or a role group, immediately or scheduled." })}
      />
      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("audience", { defaultMessage: "Audience" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}>
            <option value="all">{t("all_users", { defaultMessage: "All users" })}</option>
            <option value="tenants">{t("tenants", { defaultMessage: "Tenants" })}</option>
            <option value="supervisors">{t("supervisors", { defaultMessage: "Supervisors" })}</option>
            <option value="technicians">{t("technicians", { defaultMessage: "Technicians" })}</option>
            <option value="vendors">{t("vendors", { defaultMessage: "Vendors" })}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("language", { defaultMessage: "Language" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("message", { defaultMessage: "Message" })}</span>
          <textarea className="min-h-24 w-full rounded-md border p-3 text-sm" value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("schedule", { defaultMessage: "Schedule (optional)" })}</span>
          <Input type="datetime-local" value={form.send_at} onChange={(event) => setForm((current) => ({ ...current, send_at: event.target.value }))} />
        </label>
        <div className="flex items-end justify-end">
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={send}>{t("send_broadcast", { defaultMessage: "Send / schedule" })}</Button>
        </div>
      </section>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{row.title || t("broadcast", { defaultMessage: "Broadcast" })}</p>
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-2 text-sm">{row.body}</p>
            <p className="mt-1 text-xs text-slate-500">
              {row.sender_name} · {row.audience} · {row.language} · {formatDate(row.sent_at || row.send_at)} · {row.recipient_count} {t("recipients", { defaultMessage: "recipients" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
