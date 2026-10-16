"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import { billingApi } from "@/services/billing/billing-api";
import { companiesApi } from "@/services/companies/companies-api";
import { platformApi } from "@/services/platform/platform-api";
import { BILLING_CURRENCIES, apiError, formatDay, formatMoney, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import {
  AdjustmentFields,
  EMPTY_LINE,
  InvoiceLinesEditor,
  TotalsSummary,
  adjustmentsPayload,
  computeTotals,
  linesFromInvoice,
  linesPayload,
} from "@/containers/billing/invoice-lines";

const NO_SUBSCRIPTION = "none";

function settingValue(groups, key) {
  for (const group of groups || []) {
    const match = (group.settings || []).find((setting) => setting.key === key);
    if (match) return match.value;
  }
  return null;
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function InvoiceForm({ invoice, initialCompanyId }) {
  const t = useT("common");
  const router = useRouter();
  const editing = Boolean(invoice);
  const [companies, setCompanies] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(invoice?.company_id || initialCompanyId || "");
  const [subscriptionId, setSubscriptionId] = useState(invoice?.subscription_id || NO_SUBSCRIPTION);
  const [currency, setCurrency] = useState(invoice?.currency || "QAR");
  const [dates, setDates] = useState({
    invoice_date: invoice?.invoice_date || "",
    due_date: invoice?.due_date || "",
    period_start: invoice?.period_start || "",
    period_end: invoice?.period_end || "",
  });
  const [notes, setNotes] = useState(invoice?.notes || "");
  const [lines, setLines] = useState(() => linesFromInvoice(invoice));
  const [adjustments, setAdjustments] = useState({
    discount_type: invoice?.discount_type || "none",
    discount_value: invoice?.discount_value ?? "",
    tax_rate: invoice?.tax_rate ?? "",
  });

  useEffect(() => {
    if (editing) return;
    Promise.all([companiesApi.list(), platformApi.settings()])
      .then(([companyRows, settings]) => {
        setCompanies(Array.isArray(companyRows) ? companyRows : []);
        const groups = settings?.groups || [];
        const defaultCurrency = settingValue(groups, "billing_default_currency");
        const taxRate = settingValue(groups, "billing_tax_rate");
        if (defaultCurrency) setCurrency(defaultCurrency);
        if (taxRate != null) setAdjustments((current) => ({ ...current, tax_rate: String(taxRate) }));
      })
      .catch((error) => toast.error(apiError(error, "Failed to load form data")));
  }, [editing]);

  useEffect(() => {
    if (editing || !companyId) {
      setSubscriptions([]);
      return;
    }
    platformApi.subscriptions({ company_id: companyId })
      .then((rows) => setSubscriptions(Array.isArray(rows) ? rows : []))
      .catch(() => setSubscriptions([]));
  }, [companyId, editing]);

  const selectedCompany = companies.find((company) => company.id === companyId);
  const totals = useMemo(
    () => computeTotals({ lines, currency, ...adjustments }),
    [lines, currency, adjustments]
  );

  const applySubscription = (id) => {
    setSubscriptionId(id);
    const subscription = subscriptions.find((row) => row.id === id);
    if (!subscription) return;
    const pricing = subscription.pricing || {};
    setCurrency(subscription.currency || currency);
    setLines([{
      description: `${subscription.plan_name || "Subscription"} – ${labelize(subscription.billing_cycle || "monthly")}`,
      quantity: "1",
      unit_price: pricing.base_price != null ? String(pricing.base_price) : "",
    }]);
    setAdjustments({
      discount_type: subscription.discount_type || "none",
      discount_value: subscription.discount_value ?? "",
      tax_rate: pricing.tax_rate != null ? String(pricing.tax_rate) : adjustments.tax_rate,
    });
    if (subscription.starts_at) setDates((current) => ({ ...current, period_start: formatDay(subscription.starts_at) }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const items = linesPayload(lines);
    if (!editing && !companyId) {
      toast.error(t("select_company", { defaultMessage: "Select a company" }));
      return;
    }
    if (items.length === 0) {
      toast.error(t("invoice_lines_required", { defaultMessage: "Add at least one invoice line." }));
      return;
    }
    const payload = {
      currency,
      items,
      notes: notes || null,
      invoice_date: dates.invoice_date || null,
      due_date: dates.due_date || null,
      period_start: dates.period_start || null,
      period_end: dates.period_end || null,
      ...adjustmentsPayload(adjustments),
    };
    if (!editing) {
      payload.company_id = companyId;
      if (subscriptionId !== NO_SUBSCRIPTION) payload.subscription_id = subscriptionId;
    }

    setSaving(true);
    try {
      const saved = editing
        ? await billingApi.updateInvoice(invoice.id, payload)
        : await billingApi.createInvoice(payload);
      toast.success(editing
        ? t("invoice_draft_saved", { defaultMessage: "Draft saved" })
        : t("invoice_draft_created", { defaultMessage: "Draft invoice created" }));
      router.push(`/billing/invoices/${saved.id}`);
    } catch (error) {
      toast.error(apiError(error, t("invoice_save_failed", { defaultMessage: "Unable to save invoice" })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <PageHeader
        icon={ReceiptText}
        title={editing
          ? t("edit_draft_invoice", { defaultMessage: "Edit draft invoice" })
          : t("new_invoice", { defaultMessage: "New invoice" })}
        description={t("invoice_form_desc", { defaultMessage: "Drafts stay editable until you issue them. Issued invoices can only be corrected with a reason." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        {editing ? (
          <Field label={t("company", { defaultMessage: "Company" })}>
            <p className="rounded-md border px-3 py-2 text-sm">{invoice.company_name || "—"}</p>
          </Field>
        ) : (
          <Field label={t("company", { defaultMessage: "Company" })}>
            <Select value={companyId || undefined} onValueChange={(value) => { setCompanyId(value); setSubscriptionId(NO_SUBSCRIPTION); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("select_company", { defaultMessage: "Select a company" })} /></SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompany?.access === "trial" && (
              <p className="text-sm text-amber-600 dark:text-amber-300">
                {t("trial_company_invoice_warning", { defaultMessage: "This company is on a trial. Convert it to a paid plan before invoicing." })}
              </p>
            )}
          </Field>
        )}

        {editing ? (
          <Field label={t("currency", { defaultMessage: "Currency" })}>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BILLING_CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <Field label={t("subscription_optional", { defaultMessage: "Subscription (optional)" })}>
            <Select value={subscriptionId} onValueChange={applySubscription} disabled={!companyId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUBSCRIPTION}>{t("no_subscription_custom", { defaultMessage: "None – custom invoice" })}</SelectItem>
                {subscriptions.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.plan_name} · {labelize(row.billing_cycle)} · {row.pricing?.is_paid ? formatMoney(row.pricing.total, row.currency) : t("free", { defaultMessage: "Free" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {!editing && (
          <Field label={t("currency", { defaultMessage: "Currency" })}>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BILLING_CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label={t("invoice_date_optional", { defaultMessage: "Invoice date (blank = issue date)" })}>
          <Input type="date" value={dates.invoice_date} onChange={(event) => setDates({ ...dates, invoice_date: event.target.value })} />
        </Field>
        <Field label={t("due_date_optional", { defaultMessage: "Due date (blank = platform default)" })}>
          <Input type="date" value={dates.due_date} onChange={(event) => setDates({ ...dates, due_date: event.target.value })} />
        </Field>
        <Field label={t("billing_period_start", { defaultMessage: "Billing period start" })}>
          <Input type="date" value={dates.period_start} onChange={(event) => setDates({ ...dates, period_start: event.target.value })} />
        </Field>
        <Field label={t("billing_period_end", { defaultMessage: "Billing period end" })}>
          <Input type="date" value={dates.period_end} onChange={(event) => setDates({ ...dates, period_end: event.target.value })} />
        </Field>
      </div>

      <div className="glass-panel space-y-5 rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("invoice_lines", { defaultMessage: "Invoice lines" })}
        </p>
        <InvoiceLinesEditor lines={lines.length ? lines : [{ ...EMPTY_LINE }]} onChange={setLines} currency={currency} t={t} />
        <AdjustmentFields value={adjustments} onChange={setAdjustments} t={t} />
        <TotalsSummary totals={totals} currency={currency} t={t} />
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <Field label={t("notes", { defaultMessage: "Notes" })}>
          <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={saving} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {editing ? t("save_draft", { defaultMessage: "Save draft" }) : t("create_draft", { defaultMessage: "Create draft" })}
        </Button>
      </div>
    </form>
  );
}
