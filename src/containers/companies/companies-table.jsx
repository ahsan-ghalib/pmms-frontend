"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, Eye, Plus, Timer, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

export default function CompaniesTable() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const canManage = normalizeRole(session?.user?.role) === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await companiesApi.list({ search: search || undefined, include_archived: true });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("companies_load_failed", { defaultMessage: "Failed to load companies" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const stats = useMemo(() => ({
    total: rows.filter((row) => !row.archived_at).length,
    active: rows.filter((row) => row.status === "active" && !row.archived_at).length,
    trial: rows.filter((row) => row.access === "trial" && !row.archived_at).length,
    subscribed: rows.filter((row) => row.access === "subscription" && !row.archived_at).length,
    inactive: rows.filter((row) => row.status === "inactive" && !row.archived_at).length,
    archived: rows.filter((row) => row.archived_at).length,
    users: rows.reduce((sum, row) => sum + (Number(row.users_count) || 0), 0),
    properties: rows.reduce((sum, row) => sum + (Number(row.properties_count) || 0), 0),
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active" && !row.archived_at);
    if (filter === "trial") return rows.filter((row) => row.access === "trial" && !row.archived_at);
    if (filter === "subscription") return rows.filter((row) => row.access === "subscription" && !row.archived_at);
    if (filter === "inactive") return rows.filter((row) => row.status === "inactive" && !row.archived_at);
    if (filter === "archived") return rows.filter((row) => row.archived_at);
    return rows;
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: rows.length },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "trial", label: t("on_trial", { defaultMessage: "On trial" }), count: stats.trial },
    { id: "subscription", label: t("subscribed", { defaultMessage: "Subscribed" }), count: stats.subscribed },
    { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
    { id: "archived", label: t("archived", { defaultMessage: "Archived" }), count: stats.archived },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: t("company", { defaultMessage: "Company" }),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.original.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.original.code}</p>
        </div>
      ),
    },
    {
      id: "access",
      header: t("access", { defaultMessage: "Access" }),
      cell: ({ row }) => {
        if (row.original.access === "subscription") {
          return (
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{row.original.plan_name || t("subscribed", { defaultMessage: "Subscribed" })}</p>
              <p className="text-xs text-slate-500">{t("paid_plan", { defaultMessage: "Paid plan" })}</p>
            </div>
          );
        }
        if (row.original.access === "trial") {
          return (
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-200">{t("on_trial", { defaultMessage: "On trial" })}</p>
              <p className="text-xs text-slate-500">{t("trial_access", { defaultMessage: "Trial access" })}</p>
            </div>
          );
        }
        return <span className="text-sm text-slate-400">—</span>;
      },
    },
    {
      accessorKey: "users_count",
      header: t("users", { defaultMessage: "Users" }),
      cell: ({ row }) => <span className="font-semibold">{row.original.users_count ?? 0}</span>,
    },
    {
      accessorKey: "properties_count",
      header: t("properties", { defaultMessage: "Properties" }),
      cell: ({ row }) => <span className="font-semibold">{row.original.properties_count ?? 0}</span>,
    },
    {
      accessorKey: "subscriptions_count",
      header: t("sidebar_subscriptions", { defaultMessage: "Subscriptions" }),
      cell: ({ row }) => <span className="font-semibold">{row.original.subscriptions_count ?? 0}</span>,
    },
    {
      accessorKey: "trials_count",
      header: t("sidebar_trials", { defaultMessage: "Trials" }),
      cell: ({ row }) => <span className="font-semibold">{row.original.trials_count ?? 0}</span>,
    },
    {
      accessorKey: "status",
      header: t("status", { defaultMessage: "Status" }),
      cell: ({ row }) => <StatusBadge value={row.original.archived_at ? "archived" : row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/companies/${row.original.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> {t("view", { defaultMessage: "View" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title={t("companies", { defaultMessage: "Companies" })}
        description={t("companies_desc", { defaultMessage: "Manage tenant companies across the platform." })}
        actions={canManage && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/companies/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_company", { defaultMessage: "New company" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard title={t("companies", { defaultMessage: "Companies" })} value={stats.total} theme="indigo" icon={Building2} />
        <StatCard title={t("on_trial", { defaultMessage: "On trial" })} value={stats.trial} theme="amber" icon={Timer} />
        <StatCard title={t("subscribed", { defaultMessage: "Subscribed" })} value={stats.subscribed} theme="green" icon={CreditCard} />
        <StatCard title={t("users", { defaultMessage: "Users" })} value={stats.users} theme="blue" icon={Users} />
        <StatCard title={t("properties", { defaultMessage: "Properties" })} value={stats.properties} theme="purple" icon={Building2} />
        <StatCard title={t("archived", { defaultMessage: "Archived" })} value={stats.archived} theme="rose" icon={Building2} />
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

      <TableToolbar config={{ search: { placeholder: t("search_companies", { defaultMessage: "Search companies..." }), value: search, onChange: setSearch } }} />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} />
    </div>
  );
}
