"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectField, TextField } from "@/components/form-fields";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError, formatDate, labelize } from "@/lib/pmms";

const DEACTIVATE_REASONS = [
  { value: "left_company", label: "Left company" },
  { value: "policy_violation", label: "Policy violation" },
  { value: "temporary_leave", label: "Temporary leave" },
  { value: "management_decision", label: "Management decision" },
  { value: "other", label: "Other" },
];

const ACTIVATE_REASONS = [
  { value: "issue_resolved", label: "Issue resolved" },
  { value: "returned_to_work", label: "Returned to work" },
  { value: "management_decision", label: "Management decision" },
  { value: "other", label: "Other" },
];

export function UserStatusChangeDialog({ user, options, onClose, onSaved }) {
  const activating = user && user.status !== "active";
  const reasons = useMemo(() => {
    if (activating) return options?.activate_reasons?.length ? options.activate_reasons : ACTIVATE_REASONS;
    return options?.deactivate_reasons?.length ? options.deactivate_reasons : DEACTIVATE_REASONS;
  }, [activating, options]);

  const { control, handleSubmit, watch, reset, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      status: activating ? "active" : "deactivated",
      reason: activating ? "issue_resolved" : "management_decision",
      remarks: "",
    },
  });

  useEffect(() => {
    reset({
      status: activating ? "active" : "deactivated",
      reason: activating ? "issue_resolved" : "management_decision",
      remarks: "",
    });
  }, [user?.id, activating, reset]);

  const reason = watch("reason");

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{activating ? `Activate ${user?.name || "user"}` : `Deactivate or suspend ${user?.name || "user"}`}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={handleSubmit(async (values) => {
            try {
              await pmmsUsersApi.updateStatus(user.id, values);
              toast.success("Status updated");
              onSaved();
            } catch (error) {
              toast.error(apiError(error, "Unable to update status"));
            }
          })}
        >
          <p className="text-sm text-slate-500">
            Current status: <span className="font-semibold text-slate-800 dark:text-slate-100">{labelize(user?.status)}</span>.
            Enter a reason before confirming. The account will not change until you confirm.
          </p>
          {!activating && (
            <SelectField
              label="New status"
              name="status"
              control={control}
              options={[
                { value: "deactivated", label: "Deactivated" },
                { value: "suspended", label: "Suspended" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          )}
          <SelectField label="Reason" name="reason" control={control} errors={errors} validation={{ required: "Required" }} options={reasons} />
          <TextField
            label={reason === "other" ? "Remarks (required)" : "Remarks"}
            name="remarks"
            control={control}
            errors={errors}
            validation={reason === "other" ? { required: "Required" } : {}}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} variant={activating ? "default" : "destructive"} className={activating ? "bg-violet-600 hover:bg-violet-700" : ""}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserStatusHistoryDialog({ user, history, loading, onClose }) {
  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Status history · {user?.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[28rem] space-y-3 overflow-auto">
          {loading && <p className="text-sm text-slate-500">Loading history...</p>}
          {!loading && (!history || history.length === 0) && <p className="text-sm text-slate-500">No status changes recorded yet.</p>}
          {(history || []).map((event) => (
            <div key={event.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-white/10">
              <div className="font-semibold">
                {labelize(event.from_status) || "—"} → {labelize(event.to_status)}
              </div>
              <div className="text-xs text-slate-500">
                {formatDate(event.changed_at)}
                {event.changed_by_name ? ` · ${event.changed_by_name}` : ""}
                {event.reason ? ` · ${labelize(event.reason)}` : ""}
              </div>
              {event.remarks && <p className="mt-1 text-slate-600 dark:text-slate-300">{event.remarks}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
