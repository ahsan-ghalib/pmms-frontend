"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { checklistsApi } from "@/services/checklists/checklists-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate } from "@/lib/pmms";
import { compressImages } from "@/lib/geo";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";
import { useLocaleContext } from "@/providers/locale-provider";

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
  const [woForm, setWoForm] = useState({});
  const [busy, setBusy] = useState(false);

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

  const saveResult = async (itemId, result) => {
    const draft = drafts[itemId] || {};
    const form = new FormData();
    form.append("item_id", itemId);
    form.append("result", result);
    if (draft.remarks) form.append("remarks", draft.remarks);
    const files = await compressImages(draft.files || []);
    files.slice(0, 2).forEach((file) => form.append("photos[]", file));
    setBusy(true);
    try {
      const data = await checklistsApi.recordResult(id, form);
      setExecution(data.execution);
      if (data.result?.needs_corrective_work_order) {
        toast.warning(t("checklist_fail_prompt", { defaultMessage: "Item failed. A supervisor must create a corrective work order." }));
      } else {
        toast.success(t("checklist_result_saved", { defaultMessage: "Item saved" }));
      }
    } catch (error) {
      toast.error(apiError(error, t("checklist_result_failed", { defaultMessage: "Unable to save item" })));
    } finally {
      setBusy(false);
    }
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

  if (!execution) return <div className="glass-panel h-40 animate-pulse rounded-2xl" />;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title={execution.template_name}
        description={`${execution.property_name} · ${execution.performer_name}`}
        actions={
          execution.status === "completed" ? (
            <Button variant="outline" onClick={() => checklistsApi.exportPdf(execution.id)}>{t("export_pdf", { defaultMessage: "PDF report" })}</Button>
          ) : (
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={busy} onClick={finish}>{t("complete_checklist", { defaultMessage: "Complete" })}</Button>
          )
        }
      />
      <section className="glass-panel rounded-2xl p-5 text-sm text-slate-600">
        <p><StatusBadge value={execution.status} /> · {t("started", { defaultMessage: "Started" })} {formatDate(execution.started_at)}</p>
        {execution.completed_at && <p>{t("completed", { defaultMessage: "Completed" })} {formatDate(execution.completed_at)}</p>}
        <p>
          GPS {execution.gps?.verified ? t("verified", { defaultMessage: "verified" }) : t("not_verified", { defaultMessage: "not verified" })}
          {execution.gps?.latitude != null ? ` · ${execution.gps.latitude}, ${execution.gps.longitude}` : ""}
          {execution.gps?.distance_meters != null ? ` · ${Math.round(execution.gps.distance_meters)} m` : ""}
        </p>
      </section>

      {(execution.results || []).map((row) => {
        const title = locale === "ar" ? (row.title_ar || row.title_en) : row.title_en;
        const services = categories.find((category) => category.id === woForm[row.id]?.category_id)?.services || [];
        return (
          <article key={row.id} className="glass-panel space-y-3 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{title}</p>
                {row.item_status === "inactive" && <p className="text-xs text-slate-400">{t("item_inactive_history", { defaultMessage: "Item later deactivated. This historical result is kept." })}</p>}
              </div>
              <StatusBadge value={row.result} />
            </div>
            {execution.status === "in_progress" && (
              <>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-500">{t("remarks", { defaultMessage: "Remarks" })}</span>
                  <textarea className="min-h-16 w-full rounded-md border p-3 text-sm" defaultValue={row.remarks || ""} onChange={(event) => setDrafts((current) => ({ ...current, [row.item_id]: { ...current[row.item_id], remarks: event.target.value } }))} />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-500">{t("photos_max_2", { defaultMessage: "Photos (max 2)" })}</span>
                  <Input type="file" accept="image/*" multiple onChange={(event) => setDrafts((current) => ({ ...current, [row.item_id]: { ...current[row.item_id], files: [...(event.target.files || [])].slice(0, 2) } }))} />
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => saveResult(row.item_id, "pass")}>{t("pass", { defaultMessage: "Pass" })}</Button>
                  <Button variant="destructive" disabled={busy} onClick={() => saveResult(row.item_id, "fail")}>{t("fail", { defaultMessage: "Fail" })}</Button>
                </div>
              </>
            )}
            {row.remarks && execution.status === "completed" && <p className="text-sm">{row.remarks}</p>}
            {row.photos?.length > 0 && (
              <p className="text-xs text-slate-500">{row.photos.length} {t("photos", { defaultMessage: "photos" })}</p>
            )}
            {row.failed && row.needs_corrective_work_order && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm">
                <p className="font-medium text-rose-700">{t("checklist_fail_prompt", { defaultMessage: "Item failed. A supervisor must create a corrective work order." })}</p>
                {canCreateWo && (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <select className="h-10 rounded-md border px-3 text-sm" value={woForm[row.id]?.category_id || ""} onChange={(event) => setWoForm((current) => ({ ...current, [row.id]: { ...current[row.id], category_id: event.target.value, service_id: "" } }))}>
                      <option value="">{t("category", { defaultMessage: "Category" })}</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
                    </select>
                    <select className="h-10 rounded-md border px-3 text-sm" value={woForm[row.id]?.service_id || ""} onChange={(event) => setWoForm((current) => ({ ...current, [row.id]: { ...current[row.id], service_id: event.target.value } }))}>
                      <option value="">{t("service", { defaultMessage: "Service" })}</option>
                      {services.map((service) => <option key={service.id} value={service.id}>{service.name_en}</option>)}
                    </select>
                    <Button className="md:col-span-2" disabled={busy} onClick={() => createWo(row.id)}>{t("create_corrective_wo", { defaultMessage: "Create corrective work order" })}</Button>
                  </div>
                )}
              </div>
            )}
            {row.work_order_id && (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/work-orders/${row.work_order_id}`)}>
                {t("corrective_wo", { defaultMessage: "Corrective work order" })} {row.work_order_no}
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
