"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Building2, CalendarDays, ChevronDown, ClipboardCheck, ImagePlus, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { checklistsApi } from "@/services/checklists/checklists-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate } from "@/lib/pmms";
import { compressImages } from "@/lib/geo";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";
import { useLocaleContext } from "@/providers/locale-provider";

const MAX_PHOTOS = 2;

const groupBySection = (rows) => rows.reduce((groups, row) => {
  const key = row.section || "";
  const group = groups.find((entry) => entry.key === key);
  if (group) group.rows.push(row);
  else groups.push({ key, rows: [row] });
  return groups;
}, []);

export default function ChecklistExecutionPage({ id }) {
  const t = useT("common");
  const router = useRouter();
  const { locale } = useLocaleContext();
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const canCreateWo = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [execution, setExecution] = useState(null);
  const [categories, setCategories] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [expanded, setExpanded] = useState({});
  const [woForm, setWoForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [failFlow, setFailFlow] = useState(null);

  const load = async () => {
    try {
      setExecution(await checklistsApi.show(id));
    } catch (error) {
      toast.error(apiError(error, t("checklist_load_failed", { defaultMessage: "Failed to load checklist" })));
    }
  };

  useEffect(() => {
    load();
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, [id]);

  const closeFailFlow = () => {
    (failFlow?.photos || []).forEach((photo) => URL.revokeObjectURL(photo.url));
    setFailFlow(null);
  };

  const saveResult = async (itemId, result, extra = {}, photos = null) => {
    const draft = drafts[itemId] || {};
    const form = new FormData();
    form.append("item_id", itemId);
    form.append("result", result);
    if (draft.remarks) form.append("remarks", draft.remarks);
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") form.append(key, value);
    });
    const files = await compressImages(photos ?? draft.files ?? []);
    files.slice(0, MAX_PHOTOS).forEach((file) => form.append("photos[]", file));
    setBusy(true);
    try {
      const data = await checklistsApi.recordResult(id, form);
      setExecution(data.execution);
      setDrafts((current) => ({ ...current, [itemId]: { ...current[itemId], files: [] } }));
      closeFailFlow();
      if (extra.fail_action === "work_order" && data.result?.work_order_no) {
        toast.success(t("checklist_wo_created", { defaultMessage: "Work order {number} created and linked", number: data.result.work_order_no }));
      } else {
        toast.success(t("checklist_result_saved", { defaultMessage: "Item saved" }));
      }
    } catch (error) {
      toast.error(apiError(error, t("checklist_result_failed", { defaultMessage: "Unable to save item" })));
    } finally {
      setBusy(false);
    }
  };

  const startFail = (row, title) => {
    if (row.work_order_id) {
      saveResult(row.item_id, "fail");
      return;
    }
    const remarks = drafts[row.item_id]?.remarks ?? row.remarks ?? "";
    const section = (row.section || "").trim().toLowerCase();
    const location = section ? (execution.locations || []).find((entry) => entry.name.trim().toLowerCase() === section) : null;
    setFailFlow({
      itemId: row.item_id,
      title,
      section: row.section || "",
      step: "wo",
      reason: "",
      category_id: execution.category_id || "",
      service_id: "",
      location_id: location?.id || "",
      priority: "normal",
      description: [`${row.section ? `${row.section} – ` : ""}${title}`, remarks].filter(Boolean).join("\n"),
      photos: (drafts[row.item_id]?.files || []).map((file) => ({ file, url: URL.createObjectURL(file) })),
    });
  };

  const addPhotos = (fileList) => {
    const incoming = [...(fileList || [])].filter((file) => file.type.startsWith("image/"));
    setFailFlow((current) => ({
      ...current,
      photos: [...current.photos, ...incoming.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS),
    }));
  };

  const removePhoto = (index) => {
    setFailFlow((current) => {
      URL.revokeObjectURL(current.photos[index].url);
      return { ...current, photos: current.photos.filter((_, position) => position !== index) };
    });
  };

  const submitFail = () => {
    if (!failFlow) return;
    const photos = failFlow.photos.map((photo) => photo.file);
    if (failFlow.step === "skip") {
      if (failFlow.reason.trim().length < 3) {
        toast.error(t("checklist_skip_reason_required", { defaultMessage: "Enter the reason for not creating a work order" }));
        return;
      }
      saveResult(failFlow.itemId, "fail", { fail_action: "skipped", fail_reason: failFlow.reason.trim() }, photos);
      return;
    }
    if (!failFlow.category_id || !failFlow.service_id) {
      toast.error(t("select_category_service", { defaultMessage: "Select a category and service" }));
      return;
    }
    saveResult(failFlow.itemId, "fail", {
      fail_action: "work_order",
      category_id: failFlow.category_id,
      service_id: failFlow.service_id,
      location_id: failFlow.location_id,
      priority: failFlow.priority,
      description: failFlow.description,
    }, photos);
  };

  const createWo = async (resultId) => {
    const form = woForm[resultId] || {};
    if (!form.category_id || !form.service_id) {
      toast.error(t("select_category_service", { defaultMessage: "Select a category and service" }));
      return;
    }
    setBusy(true);
    try {
      await checklistsApi.corrective(resultId, form);
      toast.success(t("corrective_created", { defaultMessage: "Corrective work order created" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("corrective_failed", { defaultMessage: "Unable to create work order" })));
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      setExecution(await checklistsApi.complete(id));
      toast.success(t("checklist_completed", { defaultMessage: "Checklist completed" }));
    } catch (error) {
      toast.error(apiError(error, t("checklist_complete_failed", { defaultMessage: "Finish every item first" })));
    } finally {
      setBusy(false);
    }
  };

  const actionLabel = (action) => ({
    work_order: t("checklist_action_work_order", { defaultMessage: "Work order created" }),
    skipped: t("checklist_action_skipped", { defaultMessage: "No work order" }),
  }[action] || "");

  if (!execution) return <div className="glass-panel h-40 animate-pulse rounded-2xl" />;

  const open = execution.status === "in_progress";
  const results = execution.results || [];
  const pendingCount = results.filter((row) => row.result !== "pass" && row.result !== "fail").length;
  const services = categories.find((category) => category.id === failFlow?.category_id)?.services || [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title={execution.template_name}
        description={t("daily_checklist", { defaultMessage: "Daily checklist" })}
        actions={
          execution.status === "completed" && (
            <Button variant="outline" onClick={() => checklistsApi.exportPdf(execution.id)}>{t("export_pdf", { defaultMessage: "PDF report" })}</Button>
          )
        }
      />

      <section className="glass-panel flex flex-wrap items-center gap-2 rounded-2xl p-4 text-sm">
        <span className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:bg-slate-900">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatDate(execution.started_at)}
        </span>
        <span className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 dark:bg-slate-900">
          <Building2 className="h-4 w-4 text-slate-400" />
          {execution.property_name}
        </span>
        <span className="flex items-center gap-2 px-2 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          GPS {execution.gps?.verified ? t("verified", { defaultMessage: "verified" }) : t("not_verified", { defaultMessage: "not verified" })}
          {execution.gps?.distance_meters != null ? ` · ${Math.round(execution.gps.distance_meters)} m` : ""}
        </span>
        <span className="ms-auto flex items-center gap-2 text-xs text-slate-500">
          {execution.performer_name} · <StatusBadge value={execution.status} />
        </span>
      </section>

      <section className="glass-panel overflow-hidden rounded-2xl">
        {groupBySection(results).map((group) => (
          <div key={group.key || "general"}>
            <p className="bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
              {group.key || t("checklist_general_section", { defaultMessage: "General" })}
            </p>
            {group.rows.map((row) => {
              const title = locale === "ar" ? (row.title_ar || row.title_en) : row.title_en;
              const isOpen = Boolean(expanded[row.id]);
              const rowServices = categories.find((category) => category.id === woForm[row.id]?.category_id)?.services || [];
              return (
                <div key={row.id} className="border-b last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <button
                      type="button"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-slate-500"
                      onClick={() => setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }))}
                      aria-label={t("details", { defaultMessage: "Details" })}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{title}</p>
                      {row.failed && row.work_order_no && (
                        <button type="button" className="text-xs text-violet-600 hover:underline" onClick={() => router.push(`/work-orders/${row.work_order_id}`)}>
                          {row.work_order_no}
                        </button>
                      )}
                      {row.failed && row.fail_action === "skipped" && (
                        <p className="truncate text-xs text-amber-700">{actionLabel("skipped")}: {row.fail_reason}</p>
                      )}
                      {row.item_status === "inactive" && (
                        <p className="text-xs text-slate-400">{t("item_inactive_history", { defaultMessage: "Item later deactivated. This historical result is kept." })}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 overflow-hidden rounded-lg border">
                      <button
                        type="button"
                        disabled={!open || busy}
                        className={`px-4 py-1.5 text-sm font-medium ${row.result === "pass" ? "bg-emerald-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900"} disabled:cursor-default`}
                        onClick={() => saveResult(row.item_id, "pass")}
                      >
                        {t("pass", { defaultMessage: "Pass" })}
                      </button>
                      <button
                        type="button"
                        disabled={!open || busy}
                        className={`border-s px-4 py-1.5 text-sm font-medium ${row.result === "fail" ? "bg-rose-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900"} disabled:cursor-default`}
                        onClick={() => startFail(row, title)}
                      >
                        {t("fail", { defaultMessage: "Fail" })}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="space-y-3 bg-slate-50/60 px-4 pb-4 pt-1 text-sm dark:bg-slate-900/40">
                      {open ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="block space-y-1">
                            <span className="text-slate-500">{t("remarks", { defaultMessage: "Remarks" })}</span>
                            <textarea
                              className="min-h-16 w-full rounded-md border p-3 text-sm"
                              defaultValue={row.remarks || ""}
                              onChange={(event) => setDrafts((current) => ({ ...current, [row.item_id]: { ...current[row.item_id], remarks: event.target.value } }))}
                            />
                          </label>
                          <label className="block space-y-1">
                            <span className="text-slate-500">{t("photos_max_2", { defaultMessage: "Photos (max 2)" })}</span>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => setDrafts((current) => ({ ...current, [row.item_id]: { ...current[row.item_id], files: [...(event.target.files || [])].slice(0, MAX_PHOTOS) } }))}
                            />
                          </label>
                        </div>
                      ) : (
                        row.remarks && <p>{row.remarks}</p>
                      )}
                      {row.photos?.length > 0 && (
                        <p className="text-xs text-slate-500">{row.photos.length} {t("photos", { defaultMessage: "photos" })}</p>
                      )}
                      {row.failed && row.needs_corrective_work_order && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="font-medium text-rose-700">{t("checklist_fail_prompt", { defaultMessage: "Item failed. A supervisor must create a corrective work order." })}</p>
                          {canCreateWo && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              <select className="h-10 rounded-md border px-3 text-sm" value={woForm[row.id]?.category_id || ""} onChange={(event) => setWoForm((current) => ({ ...current, [row.id]: { ...current[row.id], category_id: event.target.value, service_id: "" } }))}>
                                <option value="">{t("category", { defaultMessage: "Category" })}</option>
                                {categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
                              </select>
                              <select className="h-10 rounded-md border px-3 text-sm" value={woForm[row.id]?.service_id || ""} onChange={(event) => setWoForm((current) => ({ ...current, [row.id]: { ...current[row.id], service_id: event.target.value } }))}>
                                <option value="">{t("service", { defaultMessage: "Service" })}</option>
                                {rowServices.map((service) => <option key={service.id} value={service.id}>{service.name_en}</option>)}
                              </select>
                              <Button className="md:col-span-2" disabled={busy} onClick={() => createWo(row.id)}>{t("create_corrective_wo", { defaultMessage: "Create corrective work order" })}</Button>
                            </div>
                          )}
                        </div>
                      )}
                      {row.history?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-slate-500">{t("history", { defaultMessage: "History" })}</p>
                          {row.history.map((event) => (
                            <div key={event.id} className="rounded-lg border bg-white px-3 py-2 dark:bg-slate-900">
                              <p>
                                <span className={event.result === "fail" ? "font-medium text-rose-600" : "font-medium text-emerald-600"}>
                                  {event.result === "fail" ? t("fail", { defaultMessage: "Fail" }) : t("pass", { defaultMessage: "Pass" })}
                                </span>
                                {event.action ? ` · ${actionLabel(event.action)}` : ""}
                                {event.work_order_no ? ` · ${event.work_order_no}` : ""}
                              </p>
                              {event.reason && <p className="text-slate-600">{t("reason", { defaultMessage: "Reason" })}: {event.reason}</p>}
                              {event.remarks && <p className="text-slate-600">{event.remarks}</p>}
                              <p className="text-xs text-slate-400">{event.actor_name} · {formatDate(event.created_at)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {open && (
        <div className="space-y-2">
          {pendingCount > 0 && (
            <p className="text-center text-xs text-slate-500">
              {t("checklist_pending_items", { defaultMessage: "{count} items still need Pass or Fail", count: pendingCount })}
            </p>
          )}
          <Button className="h-12 w-full rounded-xl bg-blue-600 text-base hover:bg-blue-700" disabled={busy || pendingCount > 0} onClick={finish}>
            {t("submit_checklist", { defaultMessage: "Submit checklist" })}
          </Button>
        </div>
      )}

      <Dialog open={Boolean(failFlow)} onOpenChange={(value) => { if (!value && !busy) closeFailFlow(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {failFlow?.step === "skip"
                ? t("checklist_skip_title", { defaultMessage: "Reason for no work order" })
                : t("create_work_order", { defaultMessage: "Create work order" })}
            </DialogTitle>
          </DialogHeader>
          {failFlow && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">{t("checklist_create_wo_prompt", { defaultMessage: "This item failed. Do you want to create a work order to rectify?" })}</p>
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                {t("failed_item", { defaultMessage: "Failed item" })}: <span className="font-medium">{failFlow.section ? `${failFlow.section} – ` : ""}{failFlow.title}</span>
              </p>
              {failFlow.step === "skip" ? (
                <label className="block space-y-1">
                  <span className="font-medium">{t("reason", { defaultMessage: "Reason" })} *</span>
                  <textarea
                    className="min-h-24 w-full rounded-md border p-3 text-sm"
                    value={failFlow.reason}
                    onChange={(event) => setFailFlow((current) => ({ ...current, reason: event.target.value }))}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="font-medium">{t("category", { defaultMessage: "Category" })} *</span>
                    <select
                      className="h-10 w-full rounded-md border px-3 text-sm"
                      value={failFlow.category_id}
                      onChange={(event) => setFailFlow((current) => ({ ...current, category_id: event.target.value, service_id: "" }))}
                    >
                      <option value="">{t("select", { defaultMessage: "Select" })}</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium">{t("service", { defaultMessage: "Service" })} *</span>
                    <select
                      className="h-10 w-full rounded-md border px-3 text-sm"
                      value={failFlow.service_id}
                      onChange={(event) => setFailFlow((current) => ({ ...current, service_id: event.target.value }))}
                    >
                      <option value="">{t("select", { defaultMessage: "Select" })}</option>
                      {services.map((service) => <option key={service.id} value={service.id}>{service.name_en}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="font-medium">{t("location", { defaultMessage: "Location" })}</span>
                    <select
                      className="h-10 w-full rounded-md border px-3 text-sm"
                      value={failFlow.location_id}
                      onChange={(event) => setFailFlow((current) => ({ ...current, location_id: event.target.value }))}
                    >
                      <option value="">{execution.property_name}</option>
                      {(execution.locations || []).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                    </select>
                  </label>
                  <div className="space-y-1">
                    <span className="font-medium">{t("priority", { defaultMessage: "Priority" })}</span>
                    <div className="flex gap-6">
                      {["normal", "urgent"].map((value) => (
                        <label key={value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="checklist-wo-priority"
                            checked={failFlow.priority === value}
                            onChange={() => setFailFlow((current) => ({ ...current, priority: value }))}
                          />
                          {value === "urgent" ? t("urgent", { defaultMessage: "Urgent" }) : t("normal", { defaultMessage: "Normal" })}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="block space-y-1">
                    <span className="font-medium">{t("description", { defaultMessage: "Description" })}</span>
                    <textarea
                      className="min-h-20 w-full rounded-md border p-3 text-sm"
                      value={failFlow.description}
                      onChange={(event) => setFailFlow((current) => ({ ...current, description: event.target.value }))}
                    />
                  </label>
                </div>
              )}
              <div className="space-y-1">
                <span className="font-medium">{t("photos", { defaultMessage: "Photos" })}</span>
                <div className="flex gap-2">
                  {failFlow.photos.map((photo, index) => (
                    <div key={photo.url} className="relative h-20 w-24 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute end-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        onClick={() => removePhoto(index)}
                        aria-label={t("remove", { defaultMessage: "Remove" })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {failFlow.photos.length < MAX_PHOTOS && (
                    <label className="flex h-20 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed bg-blue-50 text-blue-600">
                      <ImagePlus className="h-6 w-6" />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {failFlow?.step === "skip" ? (
              <>
                <Button variant="outline" disabled={busy} onClick={() => setFailFlow((current) => ({ ...current, step: "wo" }))}>{t("back", { defaultMessage: "Back" })}</Button>
                <Button className="bg-violet-600 hover:bg-violet-700" disabled={busy} onClick={submitFail}>{t("save", { defaultMessage: "Save" })}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" disabled={busy} onClick={() => setFailFlow((current) => ({ ...current, step: "skip" }))}>
                  {t("checklist_no_work_order", { defaultMessage: "Don't create work order" })}
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled={busy} onClick={submitFail}>{t("create_work_order", { defaultMessage: "Create work order" })}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
