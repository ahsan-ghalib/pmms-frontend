"use client";

import { Badge } from "@/components/ui/badge";
import { labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const STATUS_STYLES = {
  submitted: "bg-sky-100 text-sky-800 border-sky-200",
  created: "bg-slate-100 text-slate-800 border-slate-200",
  assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  on_hold: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  verified: "bg-teal-100 text-teal-800 border-teal-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  reopened: "bg-orange-100 text-orange-800 border-orange-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  expired: "bg-amber-100 text-amber-800 border-amber-200",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  suspended: "bg-orange-100 text-orange-800 border-orange-200",
  deactivated: "bg-zinc-100 text-zinc-700 border-zinc-200",
  "on duty": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "off duty": "bg-slate-100 text-slate-700 border-slate-200",
  live: "bg-emerald-100 text-emerald-800 border-emerald-200",
  stale: "bg-amber-100 text-amber-800 border-amber-200",
  overdue: "bg-rose-100 text-rose-800 border-rose-200",
  unassigned: "bg-slate-100 text-slate-700 border-slate-200",
  trial: "bg-amber-100 text-amber-800 border-amber-200",
  subscription: "bg-blue-100 text-blue-800 border-blue-200",
  no_access: "bg-rose-100 text-rose-800 border-rose-200",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
  under_maintenance: "bg-amber-100 text-amber-800 border-amber-200",
  "under repair": "bg-amber-100 text-amber-800 border-amber-200",
  disposed: "bg-zinc-100 text-zinc-700 border-zinc-200",
  on_track: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "on track": "bg-emerald-100 text-emerald-800 border-emerald-200",
  at_risk: "bg-amber-100 text-amber-800 border-amber-200",
  "at risk": "bg-amber-100 text-amber-800 border-amber-200",
  breached: "bg-rose-100 text-rose-800 border-rose-200",
  paused: "bg-slate-100 text-slate-700 border-slate-200",
  unread: "bg-violet-100 text-violet-800 border-violet-200",
  read: "bg-slate-100 text-slate-600 border-slate-200",
  scheduled: "bg-amber-100 text-amber-800 border-amber-200",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-200",
  queued: "bg-slate-100 text-slate-700 border-slate-200",
  pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  fail: "bg-rose-100 text-rose-800 border-rose-200",
  "business calendar": "bg-violet-100 text-violet-800 border-violet-200",
};

const PRIORITY_STYLES = {
  urgent: "bg-rose-500 text-white hover:bg-rose-600",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  preventive: "bg-violet-100 text-violet-800 border-violet-200",
};

export function StatusBadge({ value }) {
  const t = useT("common");
  const key = String(value || "").toLowerCase();
  return (
    <Badge variant="outline" className={STATUS_STYLES[key] || "bg-slate-50 text-slate-700"}>
      {t(key, { defaultMessage: labelize(value) })}
    </Badge>
  );
}

export function PriorityBadge({ value }) {
  const t = useT("common");
  const key = String(value || "").toLowerCase();
  return (
    <Badge className={PRIORITY_STYLES[key] || PRIORITY_STYLES.normal}>
      {t(key, { defaultMessage: labelize(value) })}
    </Badge>
  );
}
