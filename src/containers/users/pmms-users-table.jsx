"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, LogOut, MoreHorizontal, Pencil, Plus, Shield, UserRound, UserX, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";
import { UserStatusChangeDialog, UserStatusHistoryDialog } from "./user-status-dialogs";
import { useCan } from "@/hooks/use-module-access";

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
  const [assignmentShifts, setAssignmentShifts] = useState({});
  const [statusUser, setStatusUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState(null);
  const [logoutUser, setLogoutUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const can = useCan();
  const canCreate = can("Add Users");
  const canEdit = can("Edit Users");
  const canAssign = can("Assign Users");

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

  useEffect(() => {
    pmmsUsersApi.statusOptions().then(setStatusOptions).catch(() => {});
  }, []);

  const openHistory = async (user) => {
    setHistoryUser(user);
    setHistoryLoading(true);
    try {
      const data = await pmmsUsersApi.statusHistory(user.id);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("history_load_failed", { defaultMessage: "Failed to load status history" })));
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const logoutAllSessions = async () => {
    if (!logoutUser) return;
    try {
      setLoggingOut(true);
      await pmmsUsersApi.logoutAllSessions(logoutUser.id);
      toast.success(t("sessions_ended", { defaultMessage: "All user sessions have been ended" }));
    } catch (error) {
      toast.error(apiError(error, t("sessions_end_failed", { defaultMessage: "Failed to end user sessions" })));
    } finally {
      setLoggingOut(false);
      setLogoutUser(null);
    }
  };

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status === "inactive" || row.is_blocked).length,
    technicians: rows.filter((row) => userRole(row) === Roles.TECHNICIAN).length,
    staff: rows.filter((row) => [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR].includes(userRole(row))).length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status === "inactive" || row.is_blocked);
    if (filter === "technician") return rows.filter((row) => userRole(row) === Roles.TECHNICIAN);
    if (filter === "staff") return rows.filter((row) => [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER, Roles.SUPERVISOR].includes(userRole(row)));
    return rows;
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
    { id: "staff", label: t("staff", { defaultMessage: "Staff" }), count: stats.staff },
    { id: "technician", label: t("technicians", { defaultMessage: "Technicians" }), count: stats.technicians },
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
    {
      id: "categories",
      header: t("maintenance_categories", { defaultMessage: "Categories" }),
      cell: ({ row }) => {
        const items = row.original.categories || [];
        if (row.original.role !== "technician") return "—";
        if (!items.length) return <span className="text-slate-400">{t("none", { defaultMessage: "None" })}</span>;
        return <span className="text-xs text-slate-600 dark:text-slate-300">{items.map((category) => category.name || category.name_en).join(", ")}</span>;
      },
    },
    { accessorKey: "company_name", header: t("company", { defaultMessage: "Company" }), cell: ({ row }) => row.original.company_name || "—" },
    { accessorKey: "phone", header: t("phone", { defaultMessage: "Phone" }), cell: ({ row }) => row.original.phone || "—" },
    { accessorKey: "status", header: t("status", { defaultMessage: "Status" }), cell: ({ row }) => <StatusBadge value={row.original.is_blocked ? "blocked" : row.original.status} /> },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex w-full justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 w-9 p-0" aria-label={t("more_actions", { defaultMessage: "More actions" })}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
            {canEdit && <DropdownMenuItem onClick={() => router.push(`/users/${row.original.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />{t("edit", { defaultMessage: "Edit" })}</DropdownMenuItem>}
            {canAssign && <DropdownMenuItem onClick={() => { const existing = row.original.properties || []; setAssignUser(row.original); setSelectedProperties(existing.map((item) => item.property_id).filter(Boolean)); setAssignmentShifts(Object.fromEntries(existing.filter((item) => item.property_id).map((item) => [item.property_id, { start: String(item.shift_starts_at || "").slice(0, 5), end: String(item.shift_ends_at || "").slice(0, 5) }]))); }}>{t("assign", { defaultMessage: "Assign" })}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => openHistory(row.original)}><History className="mr-2 h-4 w-4" />{t("history", { defaultMessage: "History" })}</DropdownMenuItem>
            {canEdit && row.original.id !== session?.user?.id && <DropdownMenuItem className="text-amber-700 focus:text-amber-700" onClick={() => setLogoutUser(row.original)}><LogOut className="mr-2 h-4 w-4" />{t("logout_sessions", { defaultMessage: "Logout sessions" })}</DropdownMenuItem>}
            {canEdit && <DropdownMenuItem className={row.original.status === "active" ? "text-rose-600 focus:text-rose-600" : "text-violet-700 focus:text-violet-700"} onClick={() => setStatusUser(row.original)}><UserX className="mr-2 h-4 w-4" />{row.original.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title={t("users", { defaultMessage: "Users" })}
        description={t("users_desc", { defaultMessage: "Staff users, roles, and property assignments. Tenants are managed separately." })}
        actions={canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/tenants")}>
              {t("tenants", { defaultMessage: "Tenants" })}
            </Button>
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/users/create")}>
              <Plus className="mr-2 h-4 w-4" /> {t("new_user", { defaultMessage: "New user" })}
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard title={t("users", { defaultMessage: "Users" })} value={stats.total} theme="indigo" icon={Users} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={UserRound} onClick={() => setFilter("active")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="rose" icon={UserX} onClick={() => setFilter("inactive")} />
        <StatCard title={t("staff", { defaultMessage: "Staff" })} value={stats.staff} theme="blue" icon={Shield} onClick={() => setFilter("staff")} />
        <StatCard title={t("technicians", { defaultMessage: "Technicians" })} value={stats.technicians} theme="teal" icon={Wrench} onClick={() => setFilter("technician")} />
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
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("assign_properties_to", { defaultMessage: "Assign properties to {name}", name: assignUser?.name || "" })}</DialogTitle>
          </DialogHeader>
          {userRole(assignUser) === Roles.SUPERVISOR && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("shift_hours_hint", { defaultMessage: "Leave empty if this supervisor is always on duty for the property." })}
            </p>
          )}
          <div className="max-h-80 space-y-3 overflow-auto">
            {properties.map((property) => {
              const checked = selectedProperties.includes(property.id);
              const showShifts = userRole(assignUser) === Roles.SUPERVISOR;
              return (
                <div key={property.id} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSelectedProperties((current) => event.target.checked ? [...current, property.id] : current.filter((id) => id !== property.id));
                      }}
                    />
                    {property.name}
                  </label>
                  {showShifts && checked && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="space-y-1 text-xs text-slate-500">
                        <span>{t("shift_start", { defaultMessage: "Start" })}</span>
                        <Input
                          type="time"
                          className="h-9 rounded-lg"
                          value={assignmentShifts[property.id]?.start || ""}
                          onChange={(event) => setAssignmentShifts((current) => ({
                            ...current,
                            [property.id]: { start: event.target.value, end: current[property.id]?.end || "" },
                          }))}
                        />
                      </label>
                      <label className="space-y-1 text-xs text-slate-500">
                        <span>{t("shift_end", { defaultMessage: "End" })}</span>
                        <Input
                          type="time"
                          className="h-9 rounded-lg"
                          value={assignmentShifts[property.id]?.end || ""}
                          onChange={(event) => setAssignmentShifts((current) => ({
                            ...current,
                            [property.id]: { start: current[property.id]?.start || "", end: event.target.value },
                          }))}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignUser(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={async () => {
                try {
                  const isSupervisor = userRole(assignUser) === Roles.SUPERVISOR;
                  await pmmsUsersApi.assignProperties(assignUser.id, isSupervisor
                    ? {
                        assignments: selectedProperties.map((propertyId) => ({
                          property_id: propertyId,
                          shift_starts_at: assignmentShifts[propertyId]?.start || null,
                          shift_ends_at: assignmentShifts[propertyId]?.end || null,
                        })),
                      }
                    : { property_ids: selectedProperties });
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

      <UserStatusChangeDialog
        user={statusUser}
        options={statusOptions}
        onClose={() => setStatusUser(null)}
        onSaved={() => {
          setStatusUser(null);
          load();
        }}
      />
      <UserStatusHistoryDialog
        user={historyUser}
        history={history}
        loading={historyLoading}
        onClose={() => setHistoryUser(null)}
      />
      <AlertDialog open={!!logoutUser} onOpenChange={(open) => { if (!open && !loggingOut) setLogoutUser(null); }}>
        <AlertDialogContent className="rounded-2xl border-amber-200 p-6 shadow-2xl dark:border-amber-500/30">
          <AlertDialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><LogOut className="h-6 w-6" /></div>
            <AlertDialogTitle>End all active sessions?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 leading-6">
              <span className="block">You are about to sign <strong>{logoutUser?.name || logoutUser?.email}</strong> out from every active device.</span>
              <span className="block rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"><strong>This affects:</strong> Web browser, Android app, and iOS app.</span>
              <span className="block">The user will see <strong>“Your session has ended. Please log in again.”</strong> and must sign in again on their next request.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={loggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={loggingOut} onClick={(event) => { event.preventDefault(); logoutAllSessions(); }} className="bg-amber-600 text-white hover:bg-amber-700">{loggingOut ? "Ending sessions…" : "End all sessions"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
