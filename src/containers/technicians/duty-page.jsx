"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { techniciansApi } from "@/services/technicians/technicians-api";
import { apiError, formatDate } from "@/lib/pmms";
import { formatDuration, formatMeters, getGps } from "@/lib/geo";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const OPEN_STATUSES = ["created", "assigned", "in_progress", "on_hold"];
const NEARBY_METERS = 200;

function dutyElapsed(startedAt) {
  if (!startedAt) return null;
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return null;
  return formatDuration(Math.floor((Date.now() - started) / 1000));
}

export default function DutyPage() {
  const t = useT("common");
  const router = useRouter();
  const [duty, setDuty] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [elapsed, setElapsed] = useState(null);

  const load = async () => {
    try {
      const [status, assigned] = await Promise.all([techniciansApi.duty(), techniciansApi.jobs()]);
      setDuty(status);
      setJobs(Array.isArray(assigned) ? assigned : []);
      if (status && !status.privacy_notice_accepted) {
        setPrivacyOpen(true);
      }
    } catch (error) {
      toast.error(apiError(error, t("duty_load_failed", { defaultMessage: "Failed to load duty status" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!duty?.on_duty || !duty?.session?.started_at) {
      setElapsed(null);
      return undefined;
    }
    const tick = () => setElapsed(dutyElapsed(duty.session.started_at));
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [duty?.on_duty, duty?.session?.started_at]);

  const goOnDuty = async () => {
    setBusy(true);
    try {
      let coords = {};
      try {
        coords = await getGps();
      } catch {
        coords = {};
      }
      const next = await techniciansApi.dutyOn({ privacy_accepted: true, ...coords });
      setDuty(next);
      setPrivacyOpen(false);
      toast.success(t("duty_on_success", { defaultMessage: "You are on duty. Location tracking is active." }));
      const assigned = await techniciansApi.jobs();
      setJobs(Array.isArray(assigned) ? assigned : []);
    } catch (error) {
      toast.error(apiError(error, t("duty_on_failed", { defaultMessage: "Unable to go on duty" })));
    } finally {
      setBusy(false);
    }
  };

  const goOffDuty = async () => {
    setBusy(true);
    try {
      let coords = {};
      try {
        coords = await getGps();
      } catch {
        coords = {};
      }
      const next = await techniciansApi.dutyOff(coords);
      setDuty(next);
      toast.success(t("duty_off_success", { defaultMessage: "You are off duty. Location tracking has stopped." }));
    } catch (error) {
      toast.error(apiError(error, t("duty_off_failed", { defaultMessage: "Unable to go off duty" })));
    } finally {
      setBusy(false);
    }
  };

  const onToggle = (checked) => {
    if (checked) {
      setPrivacyOpen(true);
      return;
    }
    goOffDuty();
  };

  const stats = useMemo(() => {
    const open = jobs.filter((job) => OPEN_STATUSES.includes(job.status));
    return {
      open: open.length,
      inProgress: jobs.filter((job) => job.status === "in_progress").length,
      onHold: jobs.filter((job) => job.status === "on_hold").length,
      urgent: jobs.filter((job) => job.priority === "urgent" && OPEN_STATUSES.includes(job.status)).length,
      nearby: jobs.filter((job) => OPEN_STATUSES.includes(job.status) && job.proximity_meters != null && Number(job.proximity_meters) <= NEARBY_METERS).length,
      done: jobs.filter((job) => ["completed", "verified", "closed"].includes(job.status)).length,
    };
  }, [jobs]);

  const currentJobId = duty?.session?.current_work_order_id;
  const currentJob = jobs.find((job) => job.id === currentJobId);

  const filteredJobs = useMemo(() => {
    if (filter === "open") return jobs.filter((job) => OPEN_STATUSES.includes(job.status));
    if (filter === "in_progress") return jobs.filter((job) => job.status === "in_progress");
    if (filter === "on_hold") return jobs.filter((job) => job.status === "on_hold");
    if (filter === "urgent") return jobs.filter((job) => job.priority === "urgent" && OPEN_STATUSES.includes(job.status));
    if (filter === "nearby") return jobs.filter((job) => job.proximity_meters != null && Number(job.proximity_meters) <= NEARBY_METERS);
    if (filter === "done") return jobs.filter((job) => ["completed", "verified", "closed"].includes(job.status));
    return jobs;
  }, [jobs, filter]);

  const filters = [
    { id: "open", label: t("open_jobs", { defaultMessage: "Open" }), count: stats.open },
    { id: "in_progress", label: t("in_progress", { defaultMessage: "In progress" }), count: stats.inProgress },
    { id: "on_hold", label: t("on_hold", { defaultMessage: "On hold" }), count: stats.onHold },
    { id: "urgent", label: t("urgent", { defaultMessage: "Urgent" }), count: stats.urgent },
    { id: "nearby", label: t("nearby", { defaultMessage: "Nearby" }), count: stats.nearby },
    { id: "done", label: t("completed", { defaultMessage: "Completed" }), count: stats.done },
    { id: "all", label: t("all", { defaultMessage: "All" }), count: jobs.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Radio}
        title={t("duty_title", { defaultMessage: "Duty & my jobs" })}
        description={t("duty_desc", { defaultMessage: "Turn duty on to receive jobs and share your live location." })}
        actions={
          <>
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/checklists")}>
              {t("daily_checklists", { defaultMessage: "Daily checklists" })}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={load} disabled={loading || busy}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {t("refresh", { defaultMessage: "Refresh" })}
            </Button>
          </>
        }
      />

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className={cn(
          "flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6",
          duty?.on_duty
            ? "bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent"
            : "bg-gradient-to-r from-slate-500/8 via-transparent to-transparent"
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              duty?.on_duty ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
            )}>
              <Radio className="h-6 w-6" />
              {duty?.on_duty && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t("duty_status", { defaultMessage: "Duty status" })}
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
                {duty?.on_duty
                  ? t("on_duty", { defaultMessage: "On duty" })
                  : t("off_duty", { defaultMessage: "Off duty" })}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                {duty?.on_duty
                  ? t("duty_tracking_active", { defaultMessage: "Location tracking is active while you are on duty." })
                  : t("duty_tracking_off", { defaultMessage: "Location is not tracked while duty is off." })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {duty?.on_duty && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                    {t("duty_interval", { defaultMessage: "Update interval" })}: {duty.tracking_interval_seconds || 45}s
                  </span>
                )}
                {duty?.on_duty && elapsed && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {t("on_shift", { defaultMessage: "On shift" })}: {elapsed}
                  </span>
                )}
                {duty?.session?.started_at && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {t("started", { defaultMessage: "Started" })}: {formatDate(duty.session.started_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5 md:self-center">
            <StatusBadge value={duty?.on_duty ? "on duty" : "off duty"} />
            <Switch checked={Boolean(duty?.on_duty)} disabled={busy || !duty} onCheckedChange={onToggle} />
            {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
        </div>

        {currentJob && (
          <div className="border-t border-slate-200/70 px-5 py-4 dark:border-white/10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
              {t("current_job", { defaultMessage: "Current job" })}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{currentJob.work_order_no}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentJob.property_name || "—"} · {currentJob.scheduled_time || "—"}
                </p>
              </div>
              <Button size="sm" className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push(`/work-orders/${currentJob.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> {t("open_action", { defaultMessage: "Open" })}
              </Button>
            </div>
          </div>
        )}
      </section>

      {!duty?.on_duty && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {t("duty_accept_blocked", { defaultMessage: "Duty is OFF. You can review assigned jobs, but new jobs cannot be accepted until you turn Duty ON." })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard title={t("open_jobs", { defaultMessage: "Open jobs" })} value={stats.open} theme="blue" icon={PlayCircle} />
        <StatCard title={t("in_progress", { defaultMessage: "In progress" })} value={stats.inProgress} theme="purple" icon={Radio} />
        <StatCard title={t("on_hold", { defaultMessage: "On hold" })} value={stats.onHold} theme="amber" icon={PauseCircle} />
        <StatCard title={t("urgent", { defaultMessage: "Urgent" })} value={stats.urgent} theme="rose" icon={AlertTriangle} />
        <StatCard title={t("nearby", { defaultMessage: "Nearby" })} value={stats.nearby} theme="teal" icon={MapPin} />
        <StatCard title={t("completed", { defaultMessage: "Completed" })} value={stats.done} theme="green" icon={ShieldCheck} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("my_jobs", { defaultMessage: "Assigned jobs" })}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("my_jobs_desc", { defaultMessage: "Jobs assigned to you. Open a card to check in, start, or close the work." })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === item.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
              )}
            >
              {item.label} · {item.count}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">
            <div className="glass-panel h-28 animate-pulse rounded-2xl" />
            <div className="glass-panel h-28 animate-pulse rounded-2xl" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Radio}
            title={t("no_jobs", { defaultMessage: "No jobs assigned yet" })}
            description={t("no_jobs_desc", { defaultMessage: "When a supervisor assigns work, it will appear here." })}
          />
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const isCurrent = job.id === currentJobId;
              const nearby = job.proximity_meters != null && Number(job.proximity_meters) <= NEARBY_METERS;
              return (
                <div
                  key={job.id}
                  className={cn(
                    "glass-panel rounded-2xl p-5 transition",
                    isCurrent && "ring-2 ring-violet-500"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-violet-700 dark:text-violet-300">{job.work_order_no}</p>
                        <PriorityBadge value={job.priority} />
                        <StatusBadge value={job.status} />
                        {isCurrent && (
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                            {t("current_job", { defaultMessage: "Current job" })}
                          </span>
                        )}
                        {job.status === "assigned" && !job.accepted_at && !duty?.on_duty && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-100">
                            {t("accept_needs_duty", { defaultMessage: "Accept requires duty ON" })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {job.property_name || "—"}
                        {job.description ? ` · ${job.description}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10">
                          <Clock3 className="h-3.5 w-3.5" />
                          {job.scheduled_time || job.scheduled_date || "—"}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
                          nearby
                            ? "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
                            : "bg-slate-100 dark:bg-white/10"
                        )}>
                          <MapPin className="h-3.5 w-3.5" />
                          {t("proximity", { defaultMessage: "Proximity" })}: {formatMeters(job.proximity_meters)}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => router.push(`/work-orders/${job.id}`)}>
                      <Eye className="mr-2 h-4 w-4" /> {t("open_action", { defaultMessage: "Open" })}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("privacy_title", { defaultMessage: "Location tracking notice" })}</DialogTitle>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {duty?.privacy_notice || t("privacy_body", { defaultMessage: "While Duty is ON, the app records your location at a regular interval so supervisors can see on-duty technicians on the live map. Tracking stops when you turn Duty OFF, log out, or revoke location permission." })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrivacyOpen(false)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button disabled={busy} className="bg-violet-600 hover:bg-violet-700" onClick={goOnDuty}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("accept_duty", { defaultMessage: "Accept and go on duty" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
