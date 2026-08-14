"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Shield, UserRound, UserX, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, isAdmin } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

function userRole(row) {
  return String(row?.role || "").toLowerCase();
}

export default function PmmsUsersTable() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const [rows, setRows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [assignUser, setAssignUser] = useState(null);
  const [selectedProperties, setSelectedProperties] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [users, props] = await Promise.all([
        pmmsUsersApi.list({ search: search || undefined }),
        propertiesApi.list(),
      ]);
      setRows(Array.isArray(users) ? users : []);
      setProperties(Array.isArray(props) ? props : []);
    } catch (error) {
      toast.error(apiError(error, t("users_load_failed", { defaultMessage: "Failed to load users" })));
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
    inactive: rows.filter((row) => row.status === "inactive" || row.is_blocked).length,
    technicians: rows.filter((row) => userRole(row) === Roles.TECHNICIAN).length,
    tenants: rows.filter((row) => userRole(row) === Roles.TENANT).length,
    staff: rows.filter((row) => [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR].includes(userRole(row))).length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status === "inactive" || row.is_blocked);
    if (filter === "technician") return rows.filter((row) => userRole(row) === Roles.TECHNICIAN);
    if (filter === "tenant") return rows.filter((row) => userRole(row) === Roles.TENANT);
    if (filter === "staff") return rows.filter((row) => [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR].includes(userRole(row)));
    return rows;
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
    { id: "staff", label: t("staff", { defaultMessage: "Staff" }), count: stats.staff },
    { id: "technician", label: t("technicians", { defaultMessage: "Technicians" }), count: stats.technicians },
    { id: "tenant", label: t("tenants", { defaultMessage: "Tenants" }), count: stats.tenants },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: t("user", { defaultMessage: "User" }),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
            {(row.original.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">{row.original.name}</div>
            <div className="text-xs text-slate-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    { accessorKey: "role", header: t("role", { defaultMessage: "Role" }), cell: ({ row }) => labelize(row.original.role) },
    { accessorKey: "company_name", header: t("company", { defaultMessage: "Company" }), cell: ({ row }) => row.original.company_name || "—" },
    { accessorKey: "phone", header: t("phone", { defaultMessage: "Phone" }), cell: ({ row }) => row.original.phone || "—" },
    { accessorKey: "status", header: t("status", { defaultMessage: "Status" }), cell: ({ row }) => <StatusBadge value={row.original.is_blocked ? "blocked" : row.original.status} /> },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`/users/${row.original.id}/edit`)}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setAssignUser(row.original);
              setSelectedProperties((row.original.properties || []).map((item) => item.property_id).filter(Boolean));
            }}
          >
            {t("assign", { defaultMessage: "Assign" })}
          </Button>
          {row.original.status === "active" ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                await pmmsUsersApi.updateStatus(row.original.id, "inactive");
                load();
              }}
            >
              {t("deactivate", { defaultMessage: "Deactivate" })}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={async () => {
                await pmmsUsersApi.updateStatus(row.original.id, "active");
                load();
              }}
            >
              {t("activate", { defaultMessage: "Activate" })}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t("users", { defaultMessage: "Users" })}
        description={t("users_desc", { defaultMessage: "Company users, roles, and property assignments." })}
        actions={isAdmin(session?.user?.role) && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/users/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_user", { defaultMessage: "New user" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard title={t("users", { defaultMessage: "Users" })} value={stats.total} theme="indigo" icon={Users} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={UserRound} onClick={() => setFilter("active")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="rose" icon={UserX} onClick={() => setFilter("inactive")} />
        <StatCard title={t("staff", { defaultMessage: "Staff" })} value={stats.staff} theme="blue" icon={Shield} onClick={() => setFilter("staff")} />
        <StatCard title={t("technicians", { defaultMessage: "Technicians" })} value={stats.technicians} theme="teal" icon={Wrench} onClick={() => setFilter("technician")} />
        <StatCard title={t("tenants", { defaultMessage: "Tenants" })} value={stats.tenants} theme="purple" icon={Users} onClick={() => setFilter("tenant")} />
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

      <TableToolbar
        config={{
          search: { placeholder: t("search_users", { defaultMessage: "Search users..." }), value: search, onChange: setSearch },
        }}
      />

      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />

      <Dialog open={!!assignUser} onOpenChange={() => setAssignUser(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("assign_properties_to", { defaultMessage: "Assign properties to {name}", name: assignUser?.name || "" })}</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-auto">
            {properties.map((property) => (
              <label key={property.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedProperties.includes(property.id)}
                  onChange={(event) => {
                    setSelectedProperties((current) => event.target.checked ? [...current, property.id] : current.filter((id) => id !== property.id));
                  }}
                />
                {property.name}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignUser(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={async () => {
                try {
                  await pmmsUsersApi.assignProperties(assignUser.id, { property_ids: selectedProperties });
                  toast.success(t("properties_assigned", { defaultMessage: "Properties assigned" }));
                  setAssignUser(null);
                  load();
                } catch (error) {
                  toast.error(apiError(error, t("assignment_failed", { defaultMessage: "Assignment failed" })));
                }
              }}
            >
              {t("save_changes", { defaultMessage: "Save changes" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
