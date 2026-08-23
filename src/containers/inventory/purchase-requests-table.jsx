"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function PurchaseRequestsTable() {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const canCreate = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.purchaseRequests();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("pr_load_failed", { defaultMessage: "Failed to load purchase requests" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    draft: rows.filter((row) => row.status === "draft").length,
    submitted: rows.filter((row) => row.status === "submitted").length,
    closed: rows.filter((row) => row.status === "closed").length,
  }), [rows]);

  const filtered = useMemo(() => (filter === "all" ? rows : rows.filter((row) => row.status === filter)), [rows, filter]);

  const columns = [
    { accessorKey: "pr_number", header: t("pr_number", { defaultMessage: "PR number" }), cell: ({ row }) => <span className="font-mono font-semibold text-violet-700">{row.original.pr_number}</span> },
    { accessorKey: "status", header: t("status", { defaultMessage: "Status" }), cell: ({ row }) => <StatusBadge value={row.original.status_label || row.original.status} /> },
    { accessorKey: "created_by", header: t("created_by", { defaultMessage: "Created by" }), cell: ({ row }) => row.original.created_by || "—" },
    { accessorKey: "created_at", header: t("date", { defaultMessage: "Date" }), cell: ({ row }) => formatDate(row.original.created_at) },
    { id: "items", header: t("items", { defaultMessage: "Items" }), cell: ({ row }) => row.original.items?.length || 0 },
    { accessorKey: "remarks", header: t("remarks", { defaultMessage: "Remarks" }), cell: ({ row }) => row.original.remarks || "—" },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/purchase-requests/${row.original.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> {t("open", { defaultMessage: "Open" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ShoppingCart}
        title={t("purchase_requests", { defaultMessage: "Purchase requests" })}
        description={t("pr_desc", { defaultMessage: "Draft, submit, and close purchase requests. Print a PDF when you need a hard copy." })}
        actions={canCreate && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/inventory/purchase-requests/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_pr", { defaultMessage: "New PR" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("all", { defaultMessage: "All" })} value={stats.total} theme="indigo" icon={ShoppingCart} onClick={() => setFilter("all")} />
        <StatCard title={t("draft", { defaultMessage: "Draft" })} value={stats.draft} theme="amber" icon={ShoppingCart} onClick={() => setFilter("draft")} />
        <StatCard title={t("submitted", { defaultMessage: "Submitted" })} value={stats.submitted} theme="blue" icon={ShoppingCart} onClick={() => setFilter("submitted")} />
        <StatCard title={t("closed", { defaultMessage: "Closed" })} value={stats.closed} theme="green" icon={ShoppingCart} onClick={() => setFilter("closed")} />
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "draft", "submitted", "closed"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
              filter === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {id}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
    </div>
  );
}
