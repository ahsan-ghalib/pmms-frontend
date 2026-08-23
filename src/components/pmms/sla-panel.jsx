"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { StatusBadge } from "@/components/pmms/status-badge";
import { slaApi } from "@/services/sla/sla-api";
import { formatDate } from "@/lib/pmms";

function formatClock(seconds) {
  if (seconds == null) return "—";
  const abs = Math.max(0, Number(seconds));
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SlaPanel({ sla: initial, workOrderId, complaintId, pollMs = 15000 }) {
  const [sla, setSla] = useState(initial);

  useEffect(() => {
    setSla(initial);
  }, [initial]);

  useEffect(() => {
    if (!workOrderId && !complaintId) return undefined;
    const tick = () => {
      slaApi.snapshot({
        work_order_id: workOrderId || undefined,
        complaint_id: complaintId || undefined,
      }).then(setSla).catch(() => {});
    };
    const id = setInterval(tick, pollMs);
    return () => clearInterval(id);
  }, [workOrderId, complaintId, pollMs]);

  if (!sla) {
    return (
      <div className="glass-panel rounded-2xl p-5">
        <p className="text-sm text-slate-500">No SLA policy applies yet.</p>
      </div>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-violet-600" />
          <p className="font-semibold">SLA</p>
        </div>
        <div className="flex items-center gap-2">
          {sla.paused && <StatusBadge value="paused" />}
          {sla.overall && <StatusBadge value={sla.overall_label || sla.overall} />}
        </div>
      </div>
      <p className="text-xs text-slate-500">Server time {formatDate(sla.server_now)}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {(sla.measures || []).map((measure) => (
          <div key={measure.key} className="rounded-xl border border-slate-200/70 p-3 dark:border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{measure.label}</p>
              {measure.status ? <StatusBadge value={measure.status_label || measure.status} /> : <span className="text-xs text-slate-400">—</span>}
            </div>
            <p className="text-xs text-slate-500">Elapsed {formatClock(measure.elapsed_seconds)}</p>
            <p className="text-xs text-slate-500">Remaining {formatClock(measure.remaining_seconds)}</p>
            <p className="text-xs text-slate-400">Target {formatClock(measure.target_seconds)}</p>
            {measure.uses_business_calendar && <p className="mt-1 text-[11px] text-violet-600">Business calendar</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
