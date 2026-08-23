"use client";

import { useEffect, useMemo, useState } from "react";
import { workOrdersApi } from "@/services/work-orders/work-orders-api";
import { formatDate, labelize } from "@/lib/pmms";

export default function WorkOrderPhotos({ workOrderId, photos = [] }) {
  const [urls, setUrls] = useState({});
  const photoIds = useMemo(() => photos.map((photo) => photo.id).join(","), [photos]);

  useEffect(() => {
    if (!workOrderId || photos.length === 0) {
      setUrls({});
      return undefined;
    }

    let cancelled = false;
    const created = [];

    (async () => {
      const next = {};
      for (const photo of photos) {
        try {
          const url = await workOrdersApi.photoBlob(workOrderId, photo.id);
          created.push(url);
          next[photo.id] = url;
        } catch {
          next[photo.id] = null;
        }
      }
      if (!cancelled) setUrls(next);
    })();

    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [workOrderId, photoIds]);

  if (photos.length === 0) {
    return <p className="text-sm text-slate-500">No photos uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={urls[photo.id] || undefined}
          target="_blank"
          rel="noreferrer"
          className="overflow-hidden rounded-xl border bg-slate-50"
        >
          {urls[photo.id] ? (
            <img src={urls[photo.id]} alt={photo.original_name || photo.type} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-slate-400">Loading…</div>
          )}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold">{labelize(photo.type)}</p>
            <p className="text-[11px] text-slate-500">{formatDate(photo.created_at)}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
