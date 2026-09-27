"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { FileField, SelectField, TextField } from "@/components/form-fields";
import { useForm } from "react-hook-form";
import { tenantsApi } from "@/services/tenants/tenants-api";
import { apiError, formatDate, formatDay, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const FALLBACK_REASONS = [
  { value: "rent_not_received", label: "Payment / rent not received" },
  { value: "contract_violation", label: "Contract violation" },
  { value: "vacated", label: "Tenant vacated the unit" },
  { value: "management_decision", label: "Management decision" },
  { value: "other", label: "Other" },
];

export default function TenantDetails() {
  const t = useT("common");
  const router = useRouter();
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [reasons, setReasons] = useState(FALLBACK_REASONS);
  const [dialog, setDialog] = useState(null);

  const load = async () => {
    try {
      const data = await tenantsApi.show(id);
      setTenant(data);
    } catch (error) {
      toast.error(apiError(error, t("tenant_load_failed", { defaultMessage: "Failed to load tenant" })));
    }
  };

  useEffect(() => {
    load();
    tenantsApi.options().then((data) => {
      if (Array.isArray(data?.reasons) && data.reasons.length) setReasons(data.reasons);
    }).catch(() => {});
  }, [id]);

  if (!tenant) return <div className="p-8 text-center text-muted-foreground">Loading tenant...</div>;

  const assignment = tenant.assignment || {};

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserRound}
        title={tenant.name}
        description={`${tenant.email} · ${tenant.phone || "—"}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(`/tenants/${tenant.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
            </Button>
            {tenant.status === "active" ? (
              <Button variant="destructive" onClick={() => setDialog("deactivate")}>{t("deactivate", { defaultMessage: "Deactivate / suspend" })}</Button>
            ) : (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setDialog(tenant.contract_expired ? "renew" : "reactivate")}>
                {tenant.contract_expired ? t("renew_contract", { defaultMessage: "Renew contract" }) : t("reactivate", { defaultMessage: "Reactivate" })}
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialog("renew")}>{t("renew_contract", { defaultMessage: "Renew contract" })}</Button>
          </div>
        )}
      />

      {tenant.contract_expired && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {t("contract_expired_banner", { defaultMessage: "This account is inactive because the tenancy contract has expired. Renew the contract to restore access." })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("tenant_identity", { defaultMessage: "Tenant" })}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t("status", { defaultMessage: "Status" })} value={<StatusBadge value={tenant.contract_expired ? "expired" : tenant.status} />} />
            <Row label={t("nationality", { defaultMessage: "Nationality" })} value={tenant.nationality || "—"} />
            <Row label={t("company", { defaultMessage: "Company" })} value={tenant.company_name || "—"} />
            {tenant.inactive_reason && <Row label={t("inactive_reason", { defaultMessage: "Inactive reason" })} value={labelize(tenant.inactive_reason)} />}
            {tenant.inactive_remarks && <Row label={t("remarks", { defaultMessage: "Remarks" })} value={tenant.inactive_remarks} />}
            {tenant.inactive_at && <Row label={t("inactive_at", { defaultMessage: "Changed at" })} value={`${formatDate(tenant.inactive_at)}${tenant.inactive_by_name ? ` · ${tenant.inactive_by_name}` : ""}`} />}
          </dl>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("rented_unit", { defaultMessage: "Rented unit" })}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t("property", { defaultMessage: "Property" })} value={assignment.property_name || "—"} />
            <Row label={t("location", { defaultMessage: "Location" })} value={assignment.location_name || "—"} />
            <Row label={t("unit_villa", { defaultMessage: "Unit / Villa" })} value={assignment.unit_code ? `${assignment.unit_name} (${assignment.unit_code})` : assignment.unit_name || "—"} />
          </dl>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("contract", { defaultMessage: "Contract" })}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label={t("contract_no", { defaultMessage: "Contract no" })} value={tenant.contract_no || "—"} />
            <Row label={t("contract_start", { defaultMessage: "Start" })} value={formatDay(tenant.contract_start_date)} />
            <Row label={t("contract_end", { defaultMessage: "End" })} value={formatDay(tenant.contract_end_date)} />
            <Row label={t("rent_value", { defaultMessage: "Rent value" })} value={tenant.rent_value || "—"} />
            {tenant.has_contract_file && (
              <Row
                label={t("contract_file", { defaultMessage: "Contract file" })}
                value={<a className="font-semibold text-violet-600 hover:underline" href={tenantsApi.contractUrl(tenant.id)} target="_blank" rel="noreferrer">{t("download", { defaultMessage: "Download" })}</a>}
              />
            )}
          </dl>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("account_history", { defaultMessage: "Account history" })}</p>
          <div className="mt-4 space-y-3">
            {(tenant.history || []).length === 0 && <p className="text-sm text-slate-500">—</p>}
            {(tenant.history || []).map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-white/10">
                <div className="font-semibold">{labelize(event.action)}</div>
                <div className="text-xs text-slate-500">
                  {formatDate(event.created_at)}
                  {event.actor_name ? ` · ${event.actor_name}` : ""}
                  {event.reason ? ` · ${labelize(event.reason)}` : ""}
                </div>
                {event.remarks && <p className="mt-1 text-slate-600 dark:text-slate-300">{event.remarks}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <DeactivateDialog
        open={dialog === "deactivate"}
        reasons={reasons}
        onClose={() => setDialog(null)}
        onSubmit={async (values) => {
          await tenantsApi.deactivate(tenant.id, values);
          toast.success(t("tenant_deactivated", { defaultMessage: "Tenant deactivated" }));
          setDialog(null);
          load();
        }}
      />
      <ReactivateDialog
        open={dialog === "reactivate"}
        onClose={() => setDialog(null)}
        onSubmit={async (values) => {
          await tenantsApi.reactivate(tenant.id, values);
          toast.success(t("tenant_reactivated", { defaultMessage: "Tenant reactivated" }));
          setDialog(null);
          load();
        }}
      />
      <RenewDialog
        open={dialog === "renew"}
        tenant={tenant}
        onClose={() => setDialog(null)}
        onSubmit={async (values) => {
          await tenantsApi.renew(tenant.id, values);
          toast.success(t("tenant_renewed", { defaultMessage: "Contract renewed" }));
          setDialog(null);
          load();
        }}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function DeactivateDialog({ open, reasons, onClose, onSubmit }) {
  const { control, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm({
    defaultValues: { status: "deactivated", reason: "management_decision", remarks: "" },
  });
  const reason = watch("reason");

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Deactivate or suspend tenant</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(async (values) => {
          try { await onSubmit(values); } catch (error) { toast.error(apiError(error, "Unable to deactivate tenant")); }
        })}>
          <SelectField
            label="Account status"
            name="status"
            control={control}
            options={[
              { value: "deactivated", label: "Deactivated" },
              { value: "suspended", label: "Suspended" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <SelectField label="Reason" name="reason" control={control} errors={errors} validation={{ required: "Required" }} options={reasons} />
          <TextField label={reason === "other" ? "Remarks (required)" : "Remarks"} name="remarks" control={control} errors={errors} validation={reason === "other" ? { required: "Required" } : {}} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>Confirm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReactivateDialog({ open, onClose, onSubmit }) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { remarks: "" } });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Reactivate tenant</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(async (values) => {
          try { await onSubmit(values); } catch (error) { toast.error(apiError(error, "Unable to reactivate tenant")); }
        })}>
          <TextField label="Remarks" name="remarks" control={control} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isSubmitting}>Reactivate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenewDialog({ open, tenant, onClose, onSubmit }) {
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      contract_no: tenant?.contract_no || "",
      contract_start_date: tenant?.contract_start_date || "",
      contract_end_date: tenant?.contract_end_date || "",
      rent_value: tenant?.rent_value || "",
      remarks: "",
      contract_file: null,
    },
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>Renew contract</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(async (values) => {
          try { await onSubmit(values); } catch (error) { toast.error(apiError(error, "Unable to renew contract")); }
        })}>
          <TextField label="Contract no" name="contract_no" control={control} />
          <TextField label="Start date" name="contract_start_date" type="date" control={control} errors={errors} validation={{ required: "Required" }} />
          <TextField label="End date" name="contract_end_date" type="date" control={control} errors={errors} validation={{ required: "Required" }} />
          <TextField label="Rent value" name="rent_value" control={control} />
          <FileField label="Contract file" name="contract_file" control={control} accept=".pdf,image/*" />
          <TextField label="Remarks" name="remarks" control={control} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isSubmitting}>Save and reactivate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
