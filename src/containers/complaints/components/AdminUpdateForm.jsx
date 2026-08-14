"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/helper/Loader";
import { useTranslations } from "next-intl";

export default function AdminUpdateForm({ complaint, onUpdate }) {
  const t = useTranslations("common");
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState(complaint?.status || "pending");
  const [priority, setPriority] = useState(complaint?.priority || "medium");
  const [adminNotes, setAdminNotes] = useState(complaint?.admin_notes || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onUpdate({ status, priority, admin_notes: adminNotes });
    setSaving(false);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="bg-slate-50 dark:bg-zinc-900 border-b">
        <CardTitle className="text-base font-bold">
          {t("update_complaint") || "Update Complaint"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("status") || "Status"}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            >
              <option value="pending">{t("pending") || "Pending"}</option>
              <option value="in_progress">{t("in_progress") || "In Progress"}</option>
              <option value="resolved">{t("resolved") || "Resolved"}</option>
              <option value="rejected">{t("rejected") || "Rejected"}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("priority") || "Priority"}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="low">{t("low") || "Low"}</option>
              <option value="medium">{t("medium") || "Medium"}</option>
              <option value="high">{t("high") || "High"}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("admin_notes") || "Admin Notes"}
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder={t("enter_notes_placeholder") || "Enter notes for the user..."}
            />
            <p className="text-xs text-muted-foreground">
              {t("notes_visible_to_sender") || "These notes will be visible to the sender."}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <LoadingSpinner className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t("submit") || "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
