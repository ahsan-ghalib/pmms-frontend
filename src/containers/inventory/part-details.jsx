"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Pencil, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function PartDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [part, setPart] = useState(null);
  const [photo, setPhoto] = useState(null);

  const load = async () => {
    const data = await inventoryApi.showPart(id);
    setPart(data);
    if (data.photo_url) {
      try {
        setPhoto(await inventoryApi.blob(data.photo_url));
      } catch {
        setPhoto(null);
      }
    }
  };

  useEffect(() => {
    load().catch((error) => toast.error(apiError(error, t("part_load_failed", { defaultMessage: "Failed to load part" }))));
    return () => { if (photo) URL.revokeObjectURL(photo); };
  }, [id]);

  if (!part) return <div className="p-8 text-center text-muted-foreground">{t("loading", { defaultMessage: "Loading..." })}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Package}
        title={part.name}
        description={part.sku}
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button variant="outline" onClick={() => router.push(`/inventory/parts/${part.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
              </Button>
            )}
            {canManage && part.is_low && (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/inventory/purchase-requests/create")}>
                <ShoppingCart className="mr-2 h-4 w-4" /> {t("create_pr", { defaultMessage: "Create PR" })}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <section className="glass-panel rounded-2xl p-6 md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={part.status} />
            {part.is_low && <StatusBadge value="low stock" />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <p><span className="text-slate-500">{t("category", { defaultMessage: "Category" })}:</span> {part.category?.name_en || "—"}</p>
            <p><span className="text-slate-500">{t("uom", { defaultMessage: "UoM" })}:</span> {part.unit_of_measure}</p>
            <p><span className="text-slate-500">{t("on_hand", { defaultMessage: "On hand" })}:</span> <span className={part.is_low ? "font-semibold text-rose-600" : "font-semibold"}>{part.on_hand ?? 0}</span></p>
            <p><span className="text-slate-500">{t("min_stock", { defaultMessage: "Minimum" })}:</span> {part.minimum_stock}</p>
            <p className="sm:col-span-2"><span className="text-slate-500">{t("asset_types", { defaultMessage: "Asset types" })}:</span> {(part.asset_types || []).map(labelize).join(", ") || "—"}</p>
          </div>
        </section>
        <section className="glass-panel overflow-hidden rounded-2xl">
          {photo ? <img src={photo} alt={part.name} className="h-56 w-full object-cover" /> : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-400">{t("no_photo", { defaultMessage: "No photo" })}</div>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <p className="mb-3 font-semibold">{t("balances", { defaultMessage: "Balances" })}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="pb-2">{t("part", { defaultMessage: "Part" })}</th>
                <th className="pb-2">{t("on_hand", { defaultMessage: "On hand" })}</th>
                <th className="pb-2">{t("min_stock", { defaultMessage: "Minimum" })}</th>
                <th className="pb-2">{t("status", { defaultMessage: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {(part.balances || []).map((row) => (
                <tr key={row.part_id} className="border-b last:border-0">
                  <td className="py-2">{row.name} <span className="font-mono text-xs text-slate-400">{row.sku}</span></td>
                  <td className="py-2">{row.on_hand}</td>
                  <td className="py-2">{row.minimum_stock}</td>
                  <td className="py-2">{row.is_low ? <StatusBadge value="low stock" /> : <StatusBadge value="ok" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
