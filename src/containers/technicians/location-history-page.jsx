"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import MapWithMarkers from "@/components/common/map-with-markers";
import { techniciansApi } from "@/services/technicians/technicians-api";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function LocationHistoryPage() {
  const t = useT("common");
  const router = useRouter();
  const { id } = useParams();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [history, setHistory] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  const load = async (userId = id, day = date) => {
    try {
      const data = await techniciansApi.history(userId, { date: day });
      setHistory(data);
    } catch (error) {
      toast.error(apiError(error, "Failed to load location history"));
    }
  };

  useEffect(() => {
    load();
    pmmsUsersApi.list({ role: "technician" }).then((data) => setTechnicians(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  const markers = useMemo(
    () =>
      (history?.points || []).map((point, index) => ({
        id: point.id || String(index),
        lat: point.latitude,
        lng: point.longitude,
        iconUrl: point.gap
          ? "https://maps.google.com/mapfiles/ms/icons/orange-dot.png"
          : point.stale
            ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
            : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        data: { ...point, index },
      })),
    [history]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Route}
        title={history?.technician_name || t("route_title", { defaultMessage: "Technician route" })}
        description={t("route_desc", { defaultMessage: "Current-day location history, tenant-scoped and time ordered." })}
        actions={<Button variant="outline" onClick={() => router.push("/live-map")}>{t("live_map_title", { defaultMessage: "Live map" })}</Button>}
      />

      <div className="rounded-2xl border bg-white/60 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-slate-500 mb-1">Technician</p>
          <select
            className="border rounded-md h-10 px-3 min-w-56"
            value={id}
            onChange={(event) => router.push(`/technicians/${event.target.value}/locations`)}
          >
            {technicians.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Date</p>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <Button onClick={() => load(id, date)}>{t("refresh", { defaultMessage: "Refresh" })}</Button>
      </div>

      <MapWithMarkers
        markers={markers}
        height="420px"
        minHeight="360px"
        defaultZoom={12}
        center={{ lat: 25.286, lng: 51.534 }}
        className="rounded-2xl border overflow-hidden"
        renderInfoWindow={(point) => (
          <div className="min-w-40 text-xs space-y-1">
            <p>#{point.index + 1}</p>
            <p>{formatDate(point.recorded_at)}</p>
            {point.gap && <p className="text-amber-600">Gap after previous point</p>}
            {point.stale && <p className="text-amber-600">Stale</p>}
          </div>
        )}
      />

      <div className="rounded-2xl border bg-white/60 divide-y">
        {(history?.points || []).length === 0 && <p className="p-5 text-sm text-slate-500">No points recorded for this day.</p>}
        {(history?.points || []).map((point, index) => (
          <div key={point.id || index} className="p-4 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">#{index + 1} · {formatDate(point.recorded_at)}</p>
              <p className="text-xs text-slate-500">{point.latitude}, {point.longitude}</p>
            </div>
            <div className="flex gap-2">
              {point.gap && <StatusBadge value="gap" />}
              {point.stale && <StatusBadge value="stale" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
