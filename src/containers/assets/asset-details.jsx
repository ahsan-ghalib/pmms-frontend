"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes, Download, Pencil, Printer, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { assetsApi, DOCUMENT_TYPE_LABELS } from "@/services/assets/assets-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, formatDate, formatDay, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "under_maintenance", label: "Under Repair" },
  { value: "disposed", label: "Disposed" },
];

export default function AssetDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR, Roles.PROPERTY_MANAGER].includes(role);
  const [asset, setAsset] = useState(null);
  const [images, setImages] = useState({});
  const [properties, setProperties] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [transfer, setTransfer] = useState({ to_property_id: "", to_location_id: "", reason: "", notes: "" });
  const [docType, setDocType] = useState("warranty");
  const [tree, setTree] = useState(null);

  const load = async () => {
    const data = await assetsApi.show(id);
    setAsset(data);
    setStatus(data.status);
    const next = {};
    try {
      if (data.photo_url) next.photo = await assetsApi.blob(data.photo_url);
      if (data.qr_url) next.qr = await assetsApi.blob(data.qr_url);
      if (data.barcode_url) next.barcode = await assetsApi.blob(data.barcode_url);
    } catch {
      // Private files stay hidden if the blob request fails.
    }
    setImages(next);
  };

  useEffect(() => {
    load().catch((error) => toast.error(apiError(error, t("asset_load_failed", { defaultMessage: "Failed to load asset" }))));
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    return () => Object.values(images).forEach((url) => URL.revokeObjectURL(url));
  }, [id]);

  useEffect(() => {
    if (!transfer.to_property_id) {
      setTree(null);
      return;
    }
    propertiesApi.tree(transfer.to_property_id).then(setTree).catch(() => setTree(null));
  }, [transfer.to_property_id]);

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("asset_action_failed", { defaultMessage: "Unable to update asset" })));
    } finally {
      setBusy(false);
    }
  };

  if (!asset) return <div className="glass-panel h-48 animate-pulse rounded-2xl" />;

  const locations = tree?.locations || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title={asset.name}
        description={`${asset.asset_code} · ${asset.property?.name || "—"}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => assetsApi.openLabel(asset.id)}>
              <Printer className="mr-2 h-4 w-4" /> {t("print_label", { defaultMessage: "Print label" })}
            </Button>
            <Button variant="outline" onClick={() => assetsApi.downloadLabel(asset.id, `${asset.asset_code}-label.pdf`)}>
              <Download className="mr-2 h-4 w-4" /> {t("download_pdf", { defaultMessage: "Download PDF" })}
            </Button>
            {canManage && (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => router.push(`/assets/${asset.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass-panel space-y-3 rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={asset.status_label || asset.status} />
            <span className="text-sm text-slate-500">{labelize(asset.type)}</span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-slate-500">{t("brand", { defaultMessage: "Brand" })}</dt><dd className="font-medium">{asset.brand || "—"}</dd></div>
            <div><dt className="text-slate-500">{t("model", { defaultMessage: "Model" })}</dt><dd className="font-medium">{asset.model || "—"}</dd></div>
            <div><dt className="text-slate-500">{t("serial_number", { defaultMessage: "Serial" })}</dt><dd className="font-mono">{asset.serial_number || "—"}</dd></div>
            <div><dt className="text-slate-500">{t("category", { defaultMessage: "Category" })}</dt><dd>{asset.category?.name_en || "—"}{asset.category?.status === "inactive" ? " (inactive)" : ""}</dd></div>
            <div><dt className="text-slate-500">{t("subcategory", { defaultMessage: "Subcategory" })}</dt><dd>{asset.subcategory?.name_en || "—"}</dd></div>
            <div><dt className="text-slate-500">{t("location", { defaultMessage: "Location" })}</dt><dd>{asset.location?.name || "—"}</dd></div>
            <div><dt className="text-slate-500">{t("maintenance_frequency", { defaultMessage: "Frequency" })}</dt><dd>{labelize(asset.maintenance_frequency)}</dd></div>
            <div><dt className="text-slate-500">{t("next_due", { defaultMessage: "Next due" })}</dt><dd>{formatDay(asset.next_maintenance_due_date)}</dd></div>
            <div><dt className="text-slate-500">{t("warranty", { defaultMessage: "Warranty" })}</dt><dd>{asset.warranty ? `${asset.warranty.provider || "—"} · ${formatDay(asset.warranty.ends_on)}` : "—"}</dd></div>
          </dl>
        </section>
        <section className="glass-panel space-y-3 rounded-2xl p-6">
          {images.photo ? <img src={images.photo} alt={asset.name} className="h-40 w-full rounded-xl object-cover" /> : <div className="flex h-40 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">No photo</div>}
          <div className="grid grid-cols-2 gap-2">
            {images.qr && <img src={images.qr} alt="QR" className="rounded-lg border bg-white p-2" />}
            {images.barcode && <img src={images.barcode} alt="Barcode" className="rounded-lg border bg-white p-2" />}
          </div>
        </section>
      </div>

      {canManage && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="glass-panel space-y-3 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("asset_status", { defaultMessage: "Status" })}</p>
            <select className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <textarea className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("notes", { defaultMessage: "Notes" })} value={statusNotes} onChange={(event) => setStatusNotes(event.target.value)} />
            <Button disabled={busy} onClick={() => run(() => assetsApi.updateStatus(asset.id, { status, notes: statusNotes }), t("status_updated", { defaultMessage: "Status updated" }))}>
              {t("update_status", { defaultMessage: "Update status" })}
            </Button>
          </section>
          <section className="glass-panel space-y-3 rounded-2xl p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("transfer_asset", { defaultMessage: "Transfer" })}</p>
            <select className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" value={transfer.to_property_id} onChange={(event) => setTransfer((prev) => ({ ...prev, to_property_id: event.target.value, to_location_id: "" }))}>
              <option value="">{t("to_location", { defaultMessage: "To property" })}</option>
              {properties.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <select className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" value={transfer.to_location_id} onChange={(event) => setTransfer((prev) => ({ ...prev, to_location_id: event.target.value }))}>
              <option value="">{t("location", { defaultMessage: "Location" })}</option>
              {locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <input className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("reason", { defaultMessage: "Reason" })} value={transfer.reason} onChange={(event) => setTransfer((prev) => ({ ...prev, reason: event.target.value }))} />
            <textarea className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("transfer_notes", { defaultMessage: "Transfer notes" })} value={transfer.notes} onChange={(event) => setTransfer((prev) => ({ ...prev, notes: event.target.value }))} />
            <Button disabled={busy || asset.status === "disposed"} onClick={() => run(() => assetsApi.transfer(asset.id, transfer), t("asset_transferred", { defaultMessage: "Transfer recorded" }))}>
              {t("record_transfer", { defaultMessage: "Record transfer" })}
            </Button>
          </section>
        </div>
      )}

      <section className="glass-panel space-y-3 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("documents", { defaultMessage: "Documents" })}</p>
          {canManage && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-violet-600">
              <Upload className="h-4 w-4" />
              {t("attach", { defaultMessage: "Attach" })}
              <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) run(() => assetsApi.uploadDocument(asset.id, file, docType), t("document_uploaded", { defaultMessage: "Document uploaded" }));
                event.target.value = "";
              }} />
            </label>
          )}
        </div>
        {canManage && (
          <select className="rounded-lg border bg-transparent px-3 py-2 text-sm" value={docType} onChange={(event) => setDocType(event.target.value)}>
            {Object.entries(DOCUMENT_TYPE_LABELS).filter(([key]) => key !== "photo").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        )}
        <div className="divide-y">
          {(asset.documents || []).length === 0 && <p className="text-sm text-slate-500">{t("no_documents", { defaultMessage: "No documents attached." })}</p>}
          {(asset.documents || []).map((file) => (
            <div key={file.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{file.original_name}</p>
                <p className="text-xs text-slate-500">{DOCUMENT_TYPE_LABELS[file.type] || labelize(file.type)} · {formatDate(file.uploaded_at)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => assetsApi.downloadDocument(asset.id, file.id, file.original_name)}>
                <Download className="mr-2 h-4 w-4" /> {t("download", { defaultMessage: "Download" })}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel space-y-3 rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("transfer_history", { defaultMessage: "Transfer history" })}</p>
        <div className="divide-y">
          {(asset.transfers || []).length === 0 && <p className="text-sm text-slate-500">{t("no_transfers", { defaultMessage: "No transfers recorded." })}</p>}
          {(asset.transfers || []).map((row) => (
            <div key={row.id} className="py-2 text-sm">
              <p className="font-medium">{row.from_property || "—"} → {row.to_property || "—"}</p>
              <p className="text-xs text-slate-500">{formatDate(row.transfer_at)} · {row.reason} · {row.authorized_by}</p>
              {row.notes && <p className="text-xs text-slate-500">{row.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel space-y-3 rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("service_history", { defaultMessage: "Service history" })}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">{t("date", { defaultMessage: "Date" })}</th>
                <th>{t("work_order", { defaultMessage: "Work order" })}</th>
                <th>{t("category", { defaultMessage: "Category" })}</th>
                <th>{t("technician", { defaultMessage: "Technician" })}</th>
                <th>{t("outcome", { defaultMessage: "Outcome" })}</th>
                <th>{t("parts", { defaultMessage: "Parts" })}</th>
                <th>{t("cost", { defaultMessage: "Cost" })}</th>
              </tr>
            </thead>
            <tbody>
              {(asset.service_history || []).length === 0 && (
                <tr><td colSpan={7} className="py-4 text-slate-500">{t("no_service_history", { defaultMessage: "No linked complaints or work orders yet." })}</td></tr>
              )}
              {(asset.service_history || []).map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2">{formatDay(row.completed_at || row.scheduled_date)}</td>
                  <td>
                    <button type="button" className="font-medium text-violet-600" onClick={() => router.push(`/work-orders/${row.id}`)}>
                      {row.work_order_no}
                    </button>
                    {row.complaint_no && (
                      <button type="button" className="ml-2 text-xs text-slate-500" onClick={() => router.push(`/complaints/${row.complaint_id}`)}>
                        {row.complaint_no}
                      </button>
                    )}
                  </td>
                  <td>{row.category || "—"}</td>
                  <td>{row.technician || "—"}</td>
                  <td>{row.outcome || "—"}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
