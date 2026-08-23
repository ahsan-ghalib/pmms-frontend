"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Eye, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError, formatDay, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function AssetsTable() {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const canCreate = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR, Roles.PROPERTY_MANAGER].includes(role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await assetsApi.list({ search: search || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("assets_load_failed", { defaultMessage: "Failed to load assets" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    repair: rows.filter((row) => row.status === "under_maintenance").length,
    disposed: rows.filter((row) => row.status === "disposed").length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((row) => row.status === filter);
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "under_maintenance", label: t("under_repair", { defaultMessage: "Under Repair" }), count: stats.repair },
    { id: "disposed", label: t("disposed", { defaultMessage: "Disposed" }), count: stats.disposed },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: t("asset", { defaultMessage: "Asset" }),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.original.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.original.asset_code}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: t("type", { defaultMessage: "Type" }),
      cell: ({ row }) => labelize(row.original.type),
    },
    {
      id: "category",
      header: t("category", { defaultMessage: "Category" }),
      cell: ({ row }) => row.original.category?.name_en || "—",
    },
    {
      id: "property",
      header: t("property", { defaultMessage: "Property" }),
      cell: ({ row }) => row.original.property?.name || "—",
    },
    {
      accessorKey: "serial_number",
      header: t("serial_number", { defaultMessage: "Serial" }),
      cell: ({ row }) => row.original.serial_number || "—",
    },
    {
      accessorKey: "next_maintenance_due_date",
      header: t("next_due", { defaultMessage: "Next due" }),
      cell: ({ row }) => formatDay(row.original.next_maintenance_due_date),
    },
    {
      accessorKey: "status",
      header: t("status", { defaultMessage: "Status" }),
      cell: ({ row }) => <StatusBadge value={row.original.status_label || row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/assets/${row.original.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> {t("open", { defaultMessage: "Open" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Boxes}
        title={t("assets", { defaultMessage: "Assets" })}
        description={t("assets_desc", { defaultMessage: "Register equipment, generate labels, and keep service history tenant-scoped." })}
        actions={canCreate && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/assets/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_asset", { defaultMessage: "New asset" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("assets", { defaultMessage: "Assets" })} value={stats.total} theme="indigo" icon={Boxes} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Boxes} onClick={() => setFilter("active")} />
        <StatCard title={t("under_repair", { defaultMessage: "Under Repair" })} value={stats.repair} theme="amber" icon={Wrench} onClick={() => setFilter("under_maintenance")} />
        <StatCard title={t("disposed", { defaultMessage: "Disposed" })} value={stats.disposed} theme="rose" icon={Boxes} onClick={() => setFilter("disposed")} />
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

      <TableToolbar config={{ search: { placeholder: t("search_assets", { defaultMessage: "Search name, code, serial..." }), value: search, onChange: setSearch } }} />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
    </div>
  );
}
