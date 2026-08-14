"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Hourglass, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/form-fields";
import { StatusBadge } from "@/components/pmms/status-badge";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { platformApi } from "@/services/platform/platform-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function TrialsPage() {
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = role === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(null);
  const { control, handleSubmit, reset } = useForm();

  const load = async () => {
    try {
      const [trials, companyRows] = await Promise.all([
        platformApi.trials(),
        canManage ? companiesApi.list() : Promise.resolve([]),
      ]);
      setRows(Array.isArray(trials) ? trials : []);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load trials"));
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    active: rows.filter((row) => row.status === "active").length,
    converted: rows.filter((row) => row.status === "converted").length,
    expired: rows.filter((row) => row.status === "expired").length,
  }), [rows]);

  const open = (row = null) => {
    setEditing(row || {});
    reset({
      company_id: row?.company_id || undefined,
      starts_at: row?.starts_at ? String(row.starts_at).slice(0, 16) : "",
      expires_at: row?.expires_at ? String(row.expires_at).slice(0, 16) : "",
      status: row?.status || "active",
      max_users: row?.limits?.max_users ?? 5,
      max_properties: row?.limits?.max_properties ?? 2,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Hourglass}
        title="Trials"
        description="Give a company a time-boxed sandbox before they subscribe."
        actions={canManage && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => open()}>
            <Plus className="mr-2 h-4 w-4" /> Start trial
          </Button>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active" value={stats.active} theme="blue" icon={Hourglass} />
        <StatCard title="Converted" value={stats.converted} theme="green" icon={Hourglass} />
        <StatCard title="Expired" value={stats.expired} theme="amber" icon={Hourglass} />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Hourglass} title="No trials" description="Start a 14-day trial for a new company, then convert it when they subscribe." actionLabel={canManage ? "Start trial" : undefined} onAction={canManage ? () => open() : undefined} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.id} className="glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.company_name || row.company_id}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(row.starts_at)} → {formatDate(row.expires_at)}</p>
                </div>
                <StatusBadge value={row.status} />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Limits: {row.limits?.max_users || "—"} users · {row.limits?.max_properties || "—"} properties
              </p>
              {canManage && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => open(row)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={async () => {
                    try {
                      await platformApi.deleteTrial(row.id);
                      toast.success("Trial removed");
                      load();
                    } catch (error) {
                      toast.error(apiError(error, "Unable to delete"));
                    }
                  }}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit trial" : "Start trial"}</DialogTitle></DialogHeader>
          <form className="space-y-2" onSubmit={handleSubmit(async (values) => {
            const payload = {
              company_id: values.company_id,
              starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : undefined,
              expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : undefined,
              status: values.status,
              limits: {
                max_users: values.max_users === "" ? null : Number(values.max_users),
                max_properties: values.max_properties === "" ? null : Number(values.max_properties),
              },
            };
            try {
              if (editing?.id) await platformApi.updateTrial(editing.id, payload);
              else await platformApi.createTrial(payload);
              toast.success("Trial saved");
              setEditing(null);
              load();
            } catch (error) {
              toast.error(apiError(error, "Unable to save trial"));
            }
          })}>
            {!editing?.id && (
              <SelectField label="Company" name="company_id" control={control} validation={{ required: "Required" }} options={companies.map((company) => ({ value: company.id, label: company.name }))} />
            )}
            <TextField label="Starts" name="starts_at" type="datetime-local" control={control} />
            <TextField label="Expires" name="expires_at" type="datetime-local" control={control} />
            <TextField label="Max users" name="max_users" control={control} />
            <TextField label="Max properties" name="max_properties" control={control} />
            <SelectField label="Status" name="status" control={control} options={["active", "expired", "converted", "cancelled"].map((value) => ({ value, label: value }))} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
