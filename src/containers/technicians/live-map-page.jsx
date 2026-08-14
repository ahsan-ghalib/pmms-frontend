"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import MapWithMarkers from "@/components/common/map-with-markers";
import { techniciansApi } from "@/services/technicians/technicians-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function LiveMapPage() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      const data = await techniciansApi.live();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load live locations"));
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const markers = useMemo(
    () =>
      rows
        .filter((row) => row.latitude && row.longitude)
        .map((row) => ({
          id: String(row.technician_id),
          lat: row.latitude,
          lng: row.longitude,
          iconUrl: row.stale
            ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
            : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
          data: row,
        })),
    [rows]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapPinned}
        title={t("live_map_title", { defaultMessage: "Live technician map" })}
        description={t("live_map_desc", { defaultMessage: "On-duty technicians in your permitted scope." })}
        actions={<Button variant="outline" onClick={load}>{t("refresh", { defaultMessage: "Refresh" })}</Button>}
      />

      <MapWithMarkers
        markers={markers}
        height="520px"
        minHeight="420px"
        defaultZoom={11}
        center={{ lat: 25.286, lng: 51.534 }}
        className="rounded-2xl border overflow-hidden"
        renderInfoWindow={(tech) => (
          <div className="min-w-48 space-y-1">
            <p className="font-semibold">{tech.name}</p>
            <p className="text-xs">Duty: {tech.on_duty ? "ON" : "OFF"}</p>
            <p className="text-xs">Updated: {formatDate(tech.last_update_at)}</p>
            <p className="text-xs">Job: {tech.current_work_order_no || "—"}</p>
            {tech.stale && <p className="text-xs text-amber-600">Stale point</p>}
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => router.push(`/technicians/${tech.technician_id}/locations`)}
            >
              {t("view_history", { defaultMessage: "Today's route" })}
            </Button>
          </div>
        )}
      />

      <div className="rounded-2xl border bg-white/60 divide-y">
        {rows.length === 0 && <p className="p-5 text-sm text-slate-500">No on-duty technicians right now.</p>}
        {rows.map((row) => (
          <div key={row.technician_id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-xs text-slate-500">
                {formatDate(row.last_update_at)} · {row.current_work_order_no || t("no_current_job", { defaultMessage: "No current job" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={row.stale ? "stale" : "on duty"} />
              <Button variant="outline" size="sm" onClick={() => router.push(`/technicians/${row.technician_id}/locations`)}>
                {t("view_history", { defaultMessage: "Today's route" })}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
