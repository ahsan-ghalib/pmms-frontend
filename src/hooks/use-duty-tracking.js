"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { techniciansApi } from "@/services/technicians/technicians-api";
import { getGps } from "@/lib/geo";

export function useDutyTracking({ enabled = true } = {}) {
  const [duty, setDuty] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    const data = await techniciansApi.duty();
    setDuty(data);
    return data;
  }, [enabled]);

  const ping = useCallback(async (workOrderId) => {
    const coords = await getGps();
    await techniciansApi.pingLocation({
      ...coords,
      work_order_id: workOrderId || undefined,
    });
    return coords;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh().catch(() => {});
    return undefined;
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !duty?.on_duty || permissionDenied) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    const intervalMs = Math.max(30, Math.min(60, Number(duty.tracking_interval_seconds) || 45)) * 1000;

    const send = async () => {
      try {
        await ping(duty.session?.current_work_order_id);
      } catch (error) {
        if (error?.denied) {
          setPermissionDenied(true);
        }
      }
    };

    send();
    timerRef.current = setInterval(send, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duty?.on_duty, duty?.tracking_interval_seconds, duty?.session?.current_work_order_id, enabled, permissionDenied, ping]);

  return { duty, setDuty, refresh, ping, permissionDenied, setPermissionDenied };
}
