"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Plus, UserRound, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { tenantsApi } from "@/services/tenants/tenants-api";
import { apiError, formatDay } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function TenantsTable() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await tenantsApi.list({ search: search || undefined });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("tenants_load_failed", { defaultMessage: "Failed to load tenants" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status !== "active").length,
    expiring: rows.filter((row) => row.status === "active" && row.days_until_expiry != null && row.days_until_expiry <= 30).length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status !== "active");
    if (filter === "expiring") return rows.filter((row) => row.status === "active" && row.days_until_expiry != null && row.days_until_expiry <= 30);
    return rows;
  }, [rows, filter]);

  const columns = [
    {
      accessorKey: "name",
      header: t("tenant", { defaultMessage: "Tenant" }),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{row.original.name}</div>
          <div className="text-xs text-slate-500">{row.original.email} · {row.original.phone || "—"}</div>
        </div>
      ),
    },
    { accessorKey: "nationality", header: t("nationality", { defaultMessage: "Nationality" }), cell: ({ row }) => row.original.nationality || "—" },
    {
      id: "unit",
      header: t("unit_villa", { defaultMessage: "Unit" }),
      cell: ({ row }) => row.original.assignment?.unit_name || row.original.assignment?.property_name || "—",
    },
    { accessorKey: "contract_no", header: t("contract_no", { defaultMessage: "Contract" }), cell: ({ row }) => row.original.contract_no || "—" },
    { accessorKey: "contract_end_date", header: t("contract_end", { defaultMessage: "Ends" }), cell: ({ row }) => formatDay(row.original.contract_end_date) },
    { accessorKey: "status", header: t("status", { defaultMessage: "Status" }), cell: ({ row }) => <StatusBadge value={row.original.contract_expired ? "expired" : row.original.status} /> },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => router.push(`/tenants/${row.original.id}`)}>
            <Eye className="mr-1 h-3.5 w-3.5" /> {t("view", { defaultMessage: "View" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t("tenants", { defaultMessage: "Tenants" })}
        description={t("tenants_desc", { defaultMessage: "Register tenants, assign rented units, and manage contracts separately from staff users." })}
        actions={isAdmin(session?.user?.role) && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/tenants/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_tenant", { defaultMessage: "New tenant" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("tenants", { defaultMessage: "Tenants" })} value={stats.total} theme="indigo" icon={Users} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={UserRound} onClick={() => setFilter("active")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="rose" icon={UserX} onClick={() => setFilter("inactive")} />
        <StatCard title={t("expiring", { defaultMessage: "Expiring soon" })} value={stats.expiring} theme="amber" icon={Users} onClick={() => setFilter("expiring")} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
          { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
          { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
          { id: "expiring", label: t("expiring", { defaultMessage: "Expiring soon" }), count: stats.expiring },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === item.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <TableToolbar config={{ search: { placeholder: t("search_tenants", { defaultMessage: "Search tenants..." }), value: search, onChange: setSearch } }} />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
    </div>
  );
}
