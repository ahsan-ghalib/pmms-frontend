"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Package, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function PartsTable() {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const canCreate = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.parts({ search: search || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("parts_load_failed", { defaultMessage: "Failed to load parts" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    low: rows.filter((row) => row.is_low).length,
    inactive: rows.filter((row) => row.status !== "active").length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "low") return rows.filter((row) => row.is_low);
    if (filter === "active" || filter === "inactive") return rows.filter((row) => row.status === filter);
    return rows;
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "low", label: t("low_stock", { defaultMessage: "Low stock" }), count: stats.low },
    { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: t("part", { defaultMessage: "Part" }),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.original.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.original.sku}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: t("category", { defaultMessage: "Category" }),
      cell: ({ row }) => row.original.category?.name_en || "—",
    },
    {
      accessorKey: "unit_of_measure",
      header: t("uom", { defaultMessage: "UoM" }),
    },
    {
      accessorKey: "on_hand",
      header: t("on_hand", { defaultMessage: "On hand" }),
      cell: ({ row }) => (
        <span className={row.original.is_low ? "font-semibold text-rose-600" : ""}>
          {row.original.on_hand ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "minimum_stock",
      header: t("min_stock", { defaultMessage: "Minimum" }),
    },
    {
      id: "asset_types",
      header: t("asset_types", { defaultMessage: "Asset types" }),
      cell: ({ row }) => (row.original.asset_types || []).map(labelize).join(", ") || "—",
    },
    {
      accessorKey: "status",
      header: t("status", { defaultMessage: "Status" }),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <StatusBadge value={row.original.status} />
          {row.original.is_low && <StatusBadge value="low stock" />}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/inventory/parts/${row.original.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> {t("open", { defaultMessage: "Open" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Package}
        title={t("parts_master", { defaultMessage: "Parts master" })}
        description={t("parts_desc", { defaultMessage: "SKU, stock minimums, linked asset types, and live balances from stock transactions." })}
        actions={canCreate && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/inventory/parts/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_part", { defaultMessage: "New part" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("parts", { defaultMessage: "Parts" })} value={stats.total} theme="indigo" icon={Package} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Package} onClick={() => setFilter("active")} />
        <StatCard title={t("low_stock", { defaultMessage: "Low stock" })} value={stats.low} theme="rose" icon={TriangleAlert} onClick={() => setFilter("low")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Package} onClick={() => setFilter("inactive")} />
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

      <TableToolbar config={{ search: { placeholder: t("search_parts", { defaultMessage: "Search name or SKU..." }), value: search, onChange: setSearch } }} />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
    </div>
  );
}
