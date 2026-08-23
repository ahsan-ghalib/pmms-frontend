"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Printer, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function PurchaseRequestDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [pr, setPr] = useState(null);

  const load = async () => {
    setPr(await inventoryApi.showPurchaseRequest(id));
  };

  useEffect(() => {
    load().catch((error) => toast.error(apiError(error, t("pr_load_failed", { defaultMessage: "Failed to load purchase request" }))));
  }, [id]);

  const run = async (action, success) => {
    try {
      await action();
      toast.success(success);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("pr_action_failed", { defaultMessage: "Unable to update purchase request" })));
    }
  };

  if (!pr) return <div className="p-8 text-center text-muted-foreground">{t("loading", { defaultMessage: "Loading..." })}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShoppingCart}
        title={pr.pr_number}
        description={pr.remarks || t("purchase_request", { defaultMessage: "Purchase request" })}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => inventoryApi.openPdf(pr.id)}>
              <Printer className="mr-2 h-4 w-4" /> {t("print_pdf", { defaultMessage: "Print PDF" })}
            </Button>
            {canManage && pr.status === "draft" && (
              <Button variant="outline" onClick={() => router.push(`/inventory/purchase-requests/${pr.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
              </Button>
            )}
            {canManage && pr.status === "draft" && (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => run(() => inventoryApi.transitionPurchaseRequest(pr.id, "submitted"), t("submitted", { defaultMessage: "Submitted" }))}>
                {t("submit", { defaultMessage: "Submit" })}
              </Button>
            )}
            {canManage && pr.status === "submitted" && (
              <Button onClick={() => run(() => inventoryApi.transitionPurchaseRequest(pr.id, "closed"), t("closed", { defaultMessage: "Closed" }))}>
                {t("close", { defaultMessage: "Close" })}
              </Button>
            )}
          </div>
        }
      />

      <section className="glass-panel grid gap-3 rounded-2xl p-6 sm:grid-cols-2 text-sm">
        <p><span className="text-slate-500">{t("status", { defaultMessage: "Status" })}:</span> <StatusBadge value={pr.status_label || pr.status} /></p>
        <p><span className="text-slate-500">{t("created_by", { defaultMessage: "Created by" })}:</span> {pr.created_by || "—"}</p>
        <p><span className="text-slate-500">{t("date", { defaultMessage: "Date" })}:</span> {formatDate(pr.created_at)}</p>
        <p><span className="text-slate-500">{t("submitted", { defaultMessage: "Submitted" })}:</span> {formatDate(pr.submitted_at)}</p>
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <p className="mb-3 font-semibold">{t("items", { defaultMessage: "Items" })}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400">
              <th className="pb-2">{t("sku", { defaultMessage: "SKU" })}</th>
              <th className="pb-2">{t("part", { defaultMessage: "Part" })}</th>
              <th className="pb-2">{t("qty", { defaultMessage: "Qty" })}</th>
              <th className="pb-2">{t("remarks", { defaultMessage: "Remarks" })}</th>
            </tr>
          </thead>
          <tbody>
            {(pr.items || []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2 font-mono text-xs">{item.sku || "—"}</td>
                <td className="py-2">{item.part_name}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{item.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <p className="mb-3 font-semibold">{t("history", { defaultMessage: "History" })}</p>
        {(pr.history || []).length === 0 && <p className="text-sm text-slate-500">{t("no_history", { defaultMessage: "No status history yet." })}</p>}
        <div className="space-y-2">
          {(pr.history || []).map((row, index) => (
            <p key={index} className="text-sm">
              <StatusBadge value={row.from_status || "new"} /> → <StatusBadge value={row.to_status} /> · {row.changed_by} · {formatDate(row.changed_at)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
