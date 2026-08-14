"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Globe2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SwitchField, TextField } from "@/components/form-fields";
import { StatusBadge } from "@/components/pmms/status-badge";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function LanguagesPage() {
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = role === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const { control, handleSubmit, reset } = useForm();

  const load = async () => {
    try {
      const data = await platformApi.languages();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load languages"));
    }
  };

  useEffect(() => { load(); }, []);

  const open = (row = null) => {
    setEditing(row || {});
    reset({
      code: row?.code || "",
      name: row?.name || "",
      is_rtl: Boolean(row?.is_rtl),
      is_active: row ? Boolean(row.is_active) : true,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Globe2}
        title={t("languages_title", { defaultMessage: "Languages" })}
        description={t("languages_desc", { defaultMessage: "Locales used by companies and the technician app." })}
        actions={canManage && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => open()}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_language", { defaultMessage: "New language" })}
          </Button>
        )}
      />

      {rows.length === 0 ? (
        <EmptyState icon={Globe2} title="No languages yet" description="Add English and Arabic first, then any extra locale." actionLabel={canManage ? "Add language" : undefined} onAction={canManage ? () => open() : undefined} />
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 last:border-0 dark:border-white/10">
              <div className="flex items-center gap-4">
                <span className="rounded-lg bg-violet-100 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                  {row.code}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.is_rtl ? "Right-to-left" : "Left-to-right"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.is_active ? "active" : "inactive"} />
                {canManage && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => open(row)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" className="text-rose-600" onClick={async () => {
                      try {
                        await platformApi.deleteLanguage(row.id);
                        toast.success("Language deleted");
                        load();
                      } catch (error) {
                        toast.error(apiError(error, "Unable to delete language"));
                      }
                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit language" : "New language"}</DialogTitle></DialogHeader>
          <form className="space-y-2" onSubmit={handleSubmit(async (values) => {
            try {
              if (editing?.id) await platformApi.updateLanguage(editing.id, values);
              else await platformApi.createLanguage(values);
              toast.success("Language saved");
              setEditing(null);
              load();
            } catch (error) {
              toast.error(apiError(error, "Unable to save language"));
            }
          })}>
            <TextField label="Code" name="code" control={control} validation={{ required: "Required" }} />
            <TextField label="Name" name="name" control={control} validation={{ required: "Required" }} />
            <SwitchField label="Right-to-left" name="is_rtl" control={control} />
            <SwitchField label="Active" name="is_active" control={control} />
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
