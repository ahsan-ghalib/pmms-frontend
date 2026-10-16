"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Building2, CreditCard, Download, Edit, Eye, KeyRound, MoreHorizontal, Plus, Timer, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCan } from "@/hooks/use-module-access";

export default function CompaniesTable() {
  const t = useT("common");
  const router = useRouter();
  const can = useCan();
  const canCreate = can("Add Companies");
  const canEdit = can("Edit Companies");
  const canDelete = can("Delete Companies");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deletion, setDeletion] = useState({ company: null, eligibility: null, downloaded: false, confirming: false, name: "", loading: false });

  const companyAdmin = (company) => company.admins?.[0];
  const archiveCompany = async (company) => {
    if (!window.confirm(`Archive ${company.name}?`)) return;
    try { await companiesApi.archive(company.id); toast.success("Company archived"); await load(); }
    catch (error) { toast.error(apiError(error, "Unable to archive company")); }
  };

  const openDeletion = async (company) => {
    try {
      const eligibility = await companiesApi.deletionEligibility(company.id);
      setDeletion({ company, eligibility, downloaded: false, confirming: false, name: "", loading: false });
    } catch (error) { toast.error(apiError(error, "Unable to check deletion eligibility")); }
  };

  const downloadExport = async () => {
    setDeletion((current) => ({ ...current, loading: true }));
    try {
      const blob = await companiesApi.deletionExport(deletion.company.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${deletion.company.code || "company"}-complete-export.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setDeletion((current) => ({ ...current, downloaded: true, loading: false }));
    } catch (error) { setDeletion((current) => ({ ...current, loading: false })); toast.error(apiError(error, "Unable to download company data")); }
  };

  const permanentlyDelete = async () => {
    setDeletion((current) => ({ ...current, loading: true }));
    try {
      await companiesApi.permanentlyDelete(deletion.company.id, deletion.name);
      toast.success("Company permanently deleted");
      setDeletion({ company: null, eligibility: null, downloaded: false, confirming: false, name: "", loading: false });
      await load();
    } catch (error) { setDeletion((current) => ({ ...current, loading: false })); toast.error(apiError(error, "Unable to delete company")); }
  };

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
        <div className="flex items-center gap-3">
          {row.original.logo_url ? (
            <img src={row.original.logo_url} alt="" className="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain dark:border-white/10" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-bold text-white">
              {String(row.original.name || "CO").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{row.original.name}</p>
            <p className="font-mono text-xs text-slate-500">{row.original.code}</p>
          </div>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Company actions"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Company actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/companies/${row.original.id}`)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
              {canEdit && !row.original.archived_at && <>
                <DropdownMenuItem onClick={() => router.push(`/companies/${row.original.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => companyAdmin(row.original) ? router.push(`/users/edit/${companyAdmin(row.original).id}`) : toast.error("No Company Admin found")}><KeyRound className="mr-2 h-4 w-4" /> Edit Admin</DropdownMenuItem>
              </>}
              {canDelete && !row.original.archived_at && <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => archiveCompany(row.original)}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                <DropdownMenuItem className="text-red-700" onClick={() => openDeletion(row.original)}><Trash2 className="mr-2 h-4 w-4" /> Delete Company</DropdownMenuItem>
              </>}
            </DropdownMenuContent>
          </DropdownMenu>
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
        actions={canCreate && (
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

      <Dialog open={Boolean(deletion.company)} onOpenChange={(open) => !open && !deletion.loading && setDeletion({ company: null, eligibility: null, downloaded: false, confirming: false, name: "", loading: false })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-700">Delete {deletion.company?.name}</DialogTitle>
            <DialogDescription>This permanently removes the company and its data. Only eligible expired companies and trials can be deleted.</DialogDescription>
          </DialogHeader>
          {deletion.eligibility?.eligible ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Download the complete company export before deletion. This includes properties, users, tenants, complaints, work orders, assets, inventory, purchase requests, photos, documents, and history.</div>
              <Button variant="outline" className="w-full" onClick={downloadExport} disabled={deletion.loading}><Download className="mr-2 h-4 w-4" /> {deletion.downloaded ? "Download again" : "Download complete data"}</Button>
              {deletion.downloaded && <div className="space-y-2"><label className="text-sm font-medium">Type <span className="font-semibold">{deletion.company?.name}</span> to confirm</label><Input value={deletion.name} onChange={(event) => setDeletion((current) => ({ ...current, name: event.target.value }))} placeholder={deletion.company?.name} /><p className="text-xs text-slate-500">Permanent deletion cannot be undone. Returning customers must be created as a new company.</p></div>}
            </div>
          ) : <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Deletion is blocked: {(deletion.eligibility?.blockers || []).join(", ") || "company is not eligible"}.</div>}
          <DialogFooter><Button variant="outline" onClick={() => setDeletion({ company: null, eligibility: null, downloaded: false, confirming: false, name: "", loading: false })}>Cancel</Button>{deletion.eligibility?.eligible && <Button variant="destructive" disabled={!deletion.downloaded || deletion.name !== deletion.company?.name || deletion.loading} onClick={permanentlyDelete}><Trash2 className="mr-2 h-4 w-4" /> Permanently delete</Button>}</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
