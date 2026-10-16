"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS, currencyDecimals, formatMoney, labelize } from "@/lib/pmms";
import {
  AdjustmentFields,
  InvoiceLinesEditor,
  TotalsSummary,
  adjustmentsPayload,
  computeTotals,
  linesFromInvoice,
  linesPayload,
} from "@/containers/billing/invoice-lines";

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function PaymentDialog({ open, onOpenChange, invoice, loading, onSubmit, t }) {
  const [form, setForm] = useState(() => ({
    amount: String(invoice?.balance_due ?? ""),
    paid_at: today(),
    reference: "",
    method: "bank_transfer",
    notes: "",
  }));

  if (!invoice) return null;
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("record_payment", { defaultMessage: "Record payment" })}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit({ ...form, amount: Number(form.amount), notes: form.notes || null });
          }}
        >
          <p className="rounded-xl bg-slate-100/80 px-3 py-2 text-sm dark:bg-white/5">
            {t("outstanding_balance", { defaultMessage: "Outstanding balance" })}:{" "}
            <span className="font-semibold">{formatMoney(invoice.balance_due, invoice.currency)}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("amount", { defaultMessage: "Amount" })} ({invoice.currency})</Label>
              <Input
                type="number"
                required
                min="0"
                max={invoice.balance_due}
                step={currencyDecimals(invoice.currency) === 3 ? "0.001" : "0.01"}
                value={form.amount}
                onChange={(event) => set("amount", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("payment_date", { defaultMessage: "Payment date" })}</Label>
              <Input type="date" required max={today()} value={form.paid_at} onChange={(event) => set("paid_at", event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("transaction_reference", { defaultMessage: "Transaction reference" })}</Label>
            <Input required value={form.reference} onChange={(event) => set("reference", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("payment_method", { defaultMessage: "Payment method" })}</Label>
            <Select value={form.method} onValueChange={(value) => set("method", value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>{t(`payment_method_${method}`, { defaultMessage: labelize(method) })}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("notes", { defaultMessage: "Notes" })}</Label>
            <Textarea rows={2} value={form.notes} onChange={(event) => set("notes", event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {t("record_payment", { defaultMessage: "Record payment" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CorrectionDialog({ open, onOpenChange, invoice, loading, onSubmit, t }) {
  const [lines, setLines] = useState(() => linesFromInvoice(invoice));
  const [adjustments, setAdjustments] = useState(() => ({
    discount_type: invoice?.discount_type || "none",
    discount_value: invoice?.discount_value ?? "",
    tax_rate: invoice?.tax_rate ?? "",
  }));
  const [dueDate, setDueDate] = useState(invoice?.due_date || "");
  const [reason, setReason] = useState("");

  const currency = invoice?.currency || "QAR";
  const totals = useMemo(() => computeTotals({ lines, currency, ...adjustments }), [lines, currency, adjustments]);
  if (!invoice) return null;
  const newBalance = totals.total - (invoice.amount_paid || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("correct_invoice", { defaultMessage: "Correct invoice" })} {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit({
              reason,
              items: linesPayload(lines),
              due_date: dueDate || null,
              ...adjustmentsPayload(adjustments),
            });
          }}
        >
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            {t("correction_notice", { defaultMessage: "Corrections keep the invoice number and payment history. The original and corrected amounts, reason, person and time are recorded." })}
          </p>
          <InvoiceLinesEditor lines={lines} onChange={setLines} currency={currency} t={t} />
          <AdjustmentFields value={adjustments} onChange={setAdjustments} t={t} />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("due_date", { defaultMessage: "Due date" })}</Label>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>
          <TotalsSummary
            totals={totals}
            currency={currency}
            t={t}
            extra={[
              ["original_total", "Original total", invoice.total],
              ["amount_paid", "Paid so far", invoice.amount_paid],
            ]}
          />
          <p className="text-right text-sm text-slate-500">
            {newBalance < 0
              ? `${t("credit", { defaultMessage: "Credit" })}: ${formatMoney(Math.abs(newBalance), currency)}`
              : `${t("new_balance", { defaultMessage: "New balance" })}: ${formatMoney(newBalance, currency)}`}
          </p>
          <div className="space-y-2">
            <Label>{t("correction_reason", { defaultMessage: "Reason for correction (required)" })}</Label>
            <Textarea required minLength={5} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
              {t("save_correction", { defaultMessage: "Save correction" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
