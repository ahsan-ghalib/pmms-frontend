"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { notificationsApi } from "@/services/notifications/notifications-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function NotificationInboxPage() {
  const t = useT("common");
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const data = await notificationsApi.inbox();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("notifications_failed", { defaultMessage: "Failed to load notifications" })));
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Bell}
        title={t("notifications", { defaultMessage: "Notifications" })}
        description={t("notifications_desc", { defaultMessage: "Role-relevant alerts delivered by push. Email is optional per company." })}
      />
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">{t("no_notifications", { defaultMessage: "No notifications yet." })}</p>}
        {rows.map((row) => (
          <div key={row.id} className="glass-panel flex items-start justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="font-semibold">{row.title}</p>
              <p className="text-sm text-slate-500">{row.body}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(row.created_at)} · {row.channel}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={row.read_at ? "read" : "unread"} />
              {!row.read_at && (
                <Button size="sm" variant="outline" onClick={() => notificationsApi.markRead(row.id).then(load)}>
                  {t("mark_read", { defaultMessage: "Mark read" })}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
