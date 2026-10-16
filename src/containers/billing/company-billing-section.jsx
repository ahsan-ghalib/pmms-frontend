"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/pmms/status-badge";
import { billingApi } from "@/services/billing/billing-api";
import { apiError, formatDate, formatDay, formatMoney, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const TABS = [
  ["invoices", "Invoices"],
  ["payments", "Payments"],
  ["activity", "Billing activity"],
];

function activityDetail(entry) {
  const values = entry.new_values || {};
  const parts = [];
  if (values.invoice_number) parts.push(values.invoice_number);
  if (values.amount != null && values.currency) parts.push(formatMoney(values.amount, values.currency));
  else if (values.total != null && values.currency) parts.push(formatMoney(values.total, values.currency));
  if (values.reference) parts.push(`Ref ${values.reference}`);
  if (values.reason) parts.push(`“${values.reason}”`);
  if (values.policy) parts.push(labelize(values.policy));
  return parts.join(" · ");
}

export default function CompanyBillingSection({ companyId }) {
  const t = useT("common");
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("invoices");

  useEffect(() => {
    billingApi.companyBilling(companyId)
      .then(setData)
      .catch((error) => toast.error(apiError(error, "Failed to load billing history")));
  }, [companyId]);

  if (!data) return null;
  const { totals = [], invoices = [], payments = [], activity = [], restriction = {} } = data;

  return (
    <div className="glass-panel space-y-5 rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("invoice_history", { defaultMessage: "Invoice history" })}
        </p>
        <Button size="sm" className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push(`/billing/invoices/create?company=${companyId}`)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> {t("new_invoice", { defaultMessage: "New invoice" })}
        </Button>
      </div>

      {restriction?.restricted_at && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {t("billing_restricted_since", { defaultMessage: "Access restricted for non-payment since" })} {formatDate(restriction.restricted_at)}
            </p>
            <p className="mt-0.5">
              {restriction.policy
                ? t(`restriction_policy_${restriction.policy}`, { defaultMessage: `Policy: ${labelize(restriction.policy)}` })
                : t("restriction_policy_inactive", { defaultMessage: "The current platform policy does not restrict access." })}
              {" "}{t("restriction_lifts_on_payment", { defaultMessage: "It lifts automatically once overdue invoices are paid." })}
            </p>
          </div>
        </div>
      )}

      {totals.length === 0 ? (
        <p className="text-sm text-slate-500">{t("no_issued_invoices", { defaultMessage: "No issued invoices yet." })}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {totals.map((row) => (
            <div key={row.currency} className="rounded-xl bg-slate-100/80 p-4 dark:bg-white/5">
              <p className="font-mono text-xs font-semibold text-slate-500">{row.currency}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[11px] uppercase text-slate-400">{t("invoiced", { defaultMessage: "Invoiced" })}</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{formatMoney(row.invoiced, row.currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-400">{t("paid", { defaultMessage: "Paid" })}</p>
                  <p className="font-semibold text-emerald-600">{formatMoney(row.paid, row.currency)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-slate-400">{t("outstanding", { defaultMessage: "Outstanding" })}</p>
                  <p className={cn("font-semibold", row.overdue_count ? "text-rose-600" : "text-amber-600")}>{formatMoney(row.outstanding, row.currency)}</p>
                </div>
              </div>
              {row.overdue_count > 0 && (
                <p className="mt-2 text-xs font-medium text-rose-600">{row.overdue_count} {t("overdue_invoices", { defaultMessage: "overdue invoice(s)" })}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              tab === id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {t(`billing_tab_${id}`, { defaultMessage: label })}
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        invoices.length === 0 ? (
          <p className="text-sm text-slate-500">{t("no_invoices", { defaultMessage: "No invoices" })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2">{t("invoice_number", { defaultMessage: "Invoice" })}</th>
                  <th className="py-2">{t("billing_period", { defaultMessage: "Period" })}</th>
                  <th className="py-2">{t("due_date", { defaultMessage: "Due" })}</th>
                  <th className="py-2">{t("status", { defaultMessage: "Status" })}</th>
                  <th className="py-2 text-right">{t("total", { defaultMessage: "Total" })}</th>
                  <th className="py-2 text-right">{t("balance_due", { defaultMessage: "Balance" })}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="py-2">
                      <Link href={`/billing/invoices/${invoice.id}`} className="font-semibold text-violet-700 hover:underline dark:text-violet-300">
                        {invoice.invoice_number || t("draft", { defaultMessage: "Draft" })}
                      </Link>
                    </td>
                    <td className="py-2 text-xs">{invoice.period_start ? `${formatDay(invoice.period_start)} → ${formatDay(invoice.period_end)}` : "—"}</td>
                    <td className="py-2 text-xs">{formatDay(invoice.due_date)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge value={invoice.status} />
                        {invoice.status === "issued" && <StatusBadge value={invoice.payment_status} />}
                      </div>
                    </td>
                    <td className="py-2 text-right">{formatMoney(invoice.total, invoice.currency)}</td>
                    <td className="py-2 text-right font-semibold">{invoice.status === "issued" ? formatMoney(invoice.balance_due, invoice.currency) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "payments" && (
        payments.length === 0 ? (
          <p className="text-sm text-slate-500">{t("no_payments_yet", { defaultMessage: "No payments recorded yet." })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2">{t("date", { defaultMessage: "Date" })}</th>
                  <th className="py-2">{t("invoice_number", { defaultMessage: "Invoice" })}</th>
                  <th className="py-2">{t("reference", { defaultMessage: "Reference" })}</th>
                  <th className="py-2">{t("recorded_by", { defaultMessage: "Recorded by" })}</th>
                  <th className="py-2 text-right">{t("amount", { defaultMessage: "Amount" })}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="py-2">{formatDay(payment.paid_at)}</td>
                    <td className="py-2">{payment.invoice_number || "—"}</td>
                    <td className="py-2 font-mono text-xs">{payment.reference}</td>
                    <td className="py-2">{payment.recorded_by || "—"}</td>
                    <td className="py-2 text-right font-medium text-emerald-600">{formatMoney(payment.amount, payment.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "activity" && (
        activity.length === 0 ? (
          <p className="text-sm text-slate-500">{t("no_billing_activity", { defaultMessage: "No billing activity yet." })}</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm dark:divide-white/5">
            {activity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {t(`audit_${entry.action.replace("billing.", "")}`, { defaultMessage: labelize(entry.action.replace("billing.", "")) })}
                  </p>
                  {activityDetail(entry) && <p className="text-xs text-slate-500">{activityDetail(entry)}</p>}
                </div>
                <p className="text-xs text-slate-400">{entry.actor || t("system", { defaultMessage: "System" })} · {formatDate(entry.created_at)}</p>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
