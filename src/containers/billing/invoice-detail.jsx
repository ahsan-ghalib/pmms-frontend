"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Banknote, Download, FilePenLine, Pencil, ReceiptText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import ReasonDialog from "@/components/pmms/reason-dialog";
import { StatusBadge } from "@/components/pmms/status-badge";
import { billingApi } from "@/services/billing/billing-api";
import { apiError, formatDate, formatDay, formatMoney, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { CorrectionDialog, PaymentDialog } from "@/containers/billing/invoice-dialogs";

function Section({ title, children, action }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{value || "—"}</p>
    </div>
  );
}

export default function InvoiceDetail({ id }) {
  const t = useT("common");
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    try {
      setInvoice(await billingApi.invoice(id));
    } catch (error) {
      toast.error(apiError(error, "Failed to load invoice"));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      const updated = await action();
      if (updated?.id) setInvoice(updated);
      toast.success(successMessage);
      setDialog(null);
    } catch (error) {
      toast.error(apiError(error, t("action_failed", { defaultMessage: "Action failed" })));
    } finally {
      setBusy(false);
    }
  };

  if (!invoice) return <div className="p-8 text-center text-muted-foreground">{t("loading", { defaultMessage: "Loading..." })}</div>;

  const draft = invoice.status === "draft";
  const issued = invoice.status === "issued";
  const cancelled = invoice.status === "cancelled";
  const hasPayments = (invoice.payments || []).length > 0;
  const company = invoice.company_snapshot || {};
  const currency = invoice.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ReceiptText}
        title={invoice.invoice_number || t("draft_invoice", { defaultMessage: "Draft invoice" })}
        description={`${invoice.company_name || company.name || ""}${invoice.plan_name ? ` · ${invoice.plan_name}` : ""}`}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => billingApi.downloadPdf(invoice).catch((error) => toast.error(apiError(error, "Download failed")))}>
              <Download className="mr-2 h-4 w-4" /> {t("download_pdf", { defaultMessage: "Download PDF" })}
            </Button>
            {draft && (
              <>
                <Button variant="outline" className="rounded-full" onClick={() => router.push(`/billing/invoices/${invoice.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
                </Button>
                <Button
                  className="rounded-full bg-violet-600 hover:bg-violet-700"
                  disabled={busy}
                  onClick={() => run(() => billingApi.issueInvoice(invoice.id), t("invoice_issued", { defaultMessage: "Invoice issued and emailed to the company" }))}
                >
                  <Send className="mr-2 h-4 w-4" /> {t("issue_invoice", { defaultMessage: "Issue invoice" })}
                </Button>
              </>
            )}
            {issued && invoice.balance_due > 0 && (
              <Button className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialog("payment")}>
                <Banknote className="mr-2 h-4 w-4" /> {t("record_payment", { defaultMessage: "Record payment" })}
              </Button>
            )}
            {issued && (
              <Button variant="outline" className="rounded-full" onClick={() => setDialog("correct")}>
                <FilePenLine className="mr-2 h-4 w-4" /> {t("correct", { defaultMessage: "Correct" })}
              </Button>
            )}
            {!cancelled && !hasPayments && (
              <Button variant="ghost" className="rounded-full text-rose-600" onClick={() => setDialog("cancel")}>
                <Ban className="mr-2 h-4 w-4" /> {t("cancel_invoice", { defaultMessage: "Cancel invoice" })}
              </Button>
            )}
          </div>
        )}
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={invoice.status} />
        {issued && <StatusBadge value={invoice.payment_status} />}
        <span className="text-xs text-slate-500">
          {t(`invoice_source_${invoice.source}`, { defaultMessage: labelize(invoice.source) })}
          {invoice.created_by && ` · ${invoice.created_by}`}
        </span>
      </div>

      {cancelled && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {t("cancelled_by", { defaultMessage: "Cancelled" })} {formatDate(invoice.cancelled_at)}
          {invoice.cancelled_by && ` · ${invoice.cancelled_by}`} — {invoice.cancellation_reason}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["total", "Total", invoice.total, "text-slate-900 dark:text-white"],
          ["amount_paid", "Paid", invoice.amount_paid, "text-emerald-600"],
          ["balance_due", "Balance due", invoice.balance_due, invoice.payment_status === "overdue" ? "text-rose-600" : "text-amber-600"],
          ["credit", "Credit", invoice.credit_amount, "text-sky-600"],
        ].map(([key, fallback, amount, tone]) => (
          <div key={key} className="glass-panel rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{t(key, { defaultMessage: fallback })}</p>
            <p className={`mt-1 text-2xl font-semibold ${tone}`}>{formatMoney(amount, currency)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title={t("bill_to", { defaultMessage: "Bill to" })}>
          <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
            <Link href={`/companies/${invoice.company_id}`} className="font-semibold text-violet-700 hover:underline dark:text-violet-300">
              {company.legal_name || invoice.company_name || company.name}
            </Link>
            {company.address && <p>{company.address}</p>}
            {company.country && <p>{company.country}</p>}
            {company.email && <p>{company.email}</p>}
            {company.phone && <p>{company.phone}</p>}
            {company.tax_number && <p>{t("tax_number", { defaultMessage: "Tax number" })}: {company.tax_number}</p>}
            {draft && <p className="pt-2 text-xs text-slate-400">{t("snapshot_on_issue", { defaultMessage: "Company details are captured when the invoice is issued." })}</p>}
          </div>
        </Section>
        <Section title={t("invoice_details", { defaultMessage: "Invoice details" })}>
          <div className="grid grid-cols-2 gap-4">
            <Meta label={t("invoice_date", { defaultMessage: "Invoice date" })} value={formatDay(invoice.invoice_date)} />
            <Meta label={t("due_date", { defaultMessage: "Due date" })} value={formatDay(invoice.due_date)} />
            <Meta label={t("billing_period", { defaultMessage: "Billing period" })} value={invoice.period_start ? `${formatDay(invoice.period_start)} → ${formatDay(invoice.period_end)}` : null} />
            <Meta label={t("billing_cycle", { defaultMessage: "Billing cycle" })} value={invoice.billing_cycle ? labelize(invoice.billing_cycle) : null} />
            <Meta label={t("currency", { defaultMessage: "Currency" })} value={currency} />
            <Meta label={t("issued", { defaultMessage: "Issued" })} value={invoice.issued_at ? `${formatDate(invoice.issued_at)}${invoice.issued_by ? ` · ${invoice.issued_by}` : ""}` : null} />
          </div>
        </Section>
        <Section title={t("summary", { defaultMessage: "Summary" })}>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span>{t("subtotal", { defaultMessage: "Subtotal" })}</span><span>{formatMoney(invoice.subtotal, currency)}</span></div>
            <div className="flex justify-between">
              <span>
                {t("discount", { defaultMessage: "Discount" })}
                {invoice.discount_type === "percent" && ` (${invoice.discount_value}%)`}
              </span>
              <span>-{formatMoney(invoice.discount_amount, currency)}</span>
            </div>
            <div className="flex justify-between"><span>{t("tax", { defaultMessage: "Tax" })} ({invoice.tax_rate}%)</span><span>{formatMoney(invoice.tax_amount, currency)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>{t("total", { defaultMessage: "Total" })}</span><span>{formatMoney(invoice.total, currency)}</span></div>
          </div>
        </Section>
      </div>

      <Section title={t("invoice_lines", { defaultMessage: "Invoice lines" })}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2">{t("description", { defaultMessage: "Description" })}</th>
                <th className="py-2 text-right">{t("qty", { defaultMessage: "Qty" })}</th>
                <th className="py-2 text-right">{t("unit_price", { defaultMessage: "Unit price" })}</th>
                <th className="py-2 text-right">{t("amount", { defaultMessage: "Amount" })}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(item.unit_price, currency)}</td>
                  <td className="py-2 text-right font-medium">{formatMoney(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoice.notes && <p className="mt-4 whitespace-pre-line text-sm text-slate-500">{invoice.notes}</p>}
      </Section>

      <Section title={t("payments", { defaultMessage: "Payments" })}>
        {(invoice.payments || []).length === 0 ? (
          <p className="text-sm text-slate-500">{t("no_payments_yet", { defaultMessage: "No payments recorded yet." })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2">{t("date", { defaultMessage: "Date" })}</th>
                  <th className="py-2">{t("reference", { defaultMessage: "Reference" })}</th>
                  <th className="py-2">{t("payment_method", { defaultMessage: "Method" })}</th>
                  <th className="py-2">{t("recorded_by", { defaultMessage: "Recorded by" })}</th>
                  <th className="py-2 text-right">{t("amount", { defaultMessage: "Amount" })}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100 dark:border-white/5">
                    <td className="py-2">{formatDay(payment.paid_at)}</td>
                    <td className="py-2 font-mono text-xs">{payment.reference}</td>
                    <td className="py-2">{payment.method ? labelize(payment.method) : "—"}</td>
                    <td className="py-2">{payment.recorded_by || "—"}</td>
                    <td className="py-2 text-right font-medium text-emerald-600">{formatMoney(payment.amount, payment.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {(invoice.corrections || []).length > 0 && (
        <Section title={t("correction_history", { defaultMessage: "Correction history" })}>
          <div className="space-y-3">
            {invoice.corrections.map((correction) => (
              <div key={correction.id} className="rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(correction.original_total, currency)} → {formatMoney(correction.corrected_total, currency)}
                  </p>
                  <p className="text-xs text-slate-500">{correction.corrected_by || "—"} · {formatDate(correction.created_at)}</p>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{correction.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(invoice.reminders || []).length > 0 && (
        <Section title={t("reminders_sent", { defaultMessage: "Reminders sent" })}>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {invoice.reminders.map((reminder) => (
              <li key={`${reminder.kind}-${reminder.reminder_date}`}>
                {formatDay(reminder.reminder_date)} · {t(`reminder_${reminder.kind}`, { defaultMessage: labelize(reminder.kind) })}
                {Array.isArray(reminder.recipients) && reminder.recipients.length > 0 && ` · ${reminder.recipients.join(", ")}`}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dialog === "payment" && (
        <PaymentDialog
          open
          onOpenChange={(open) => setDialog(open ? "payment" : null)}
          invoice={invoice}
          loading={busy}
          t={t}
          onSubmit={(payload) => run(() => billingApi.recordPayment(invoice.id, payload), t("payment_recorded", { defaultMessage: "Payment recorded" }))}
        />
      )}
      {dialog === "correct" && (
        <CorrectionDialog
          open
          onOpenChange={(open) => setDialog(open ? "correct" : null)}
          invoice={invoice}
          loading={busy}
          t={t}
          onSubmit={(payload) => run(() => billingApi.correctInvoice(invoice.id, payload), t("invoice_corrected", { defaultMessage: "Invoice corrected" }))}
        />
      )}
      <ReasonDialog
        open={dialog === "cancel"}
        onOpenChange={(open) => setDialog(open ? "cancel" : null)}
        title={t("cancel_invoice", { defaultMessage: "Cancel invoice" })}
        confirmLabel={t("cancel_invoice", { defaultMessage: "Cancel invoice" })}
        loading={busy}
        onSubmit={({ reason }) => run(() => billingApi.cancelInvoice(invoice.id, reason), t("invoice_cancelled", { defaultMessage: "Invoice cancelled" }))}
      />
    </div>
  );
}
