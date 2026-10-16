"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileClock, Plus, ReceiptText, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { billingApi } from "@/services/billing/billing-api";
import { BILLING_CURRENCIES, apiError, formatDay, formatMoney } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const ALL = "all";

function outstandingByCurrency(rows) {
  const totals = {};
  rows
    .filter((row) => row.status === "issued" && row.balance_due > 0)
    .forEach((row) => {
      totals[row.currency] = (totals[row.currency] || 0) + row.balance_due;
    });
  return Object.entries(totals);
}

export default function InvoicesPage() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(ALL);
  const [currency, setCurrency] = useState(ALL);
  const [search, setSearch] = useState("");

  useEffect(() => {
    billingApi.invoices()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(apiError(error, "Failed to load invoices")))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    all: rows.length,
    draft: rows.filter((row) => row.status === "draft").length,
    unpaid: rows.filter((row) => row.status === "issued" && row.payment_status === "unpaid").length,
    partially_paid: rows.filter((row) => row.status === "issued" && row.payment_status === "partially_paid").length,
    overdue: rows.filter((row) => row.status === "issued" && row.payment_status === "overdue").length,
    paid: rows.filter((row) => row.status === "issued" && row.payment_status === "paid").length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
  }), [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "draft" || tab === "cancelled") {
        if (row.status !== tab) return false;
      } else if (tab !== ALL && (row.status !== "issued" || row.payment_status !== tab)) {
        return false;
      }
      if (currency !== ALL && row.currency !== currency) return false;
      if (!term) return true;
      return [row.invoice_number, row.company_name, row.plan_name].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [rows, tab, currency, search]);

  const outstanding = outstandingByCurrency(rows);
  const tabs = [
    [ALL, "All"],
    ["draft", "Draft"],
    ["unpaid", "Unpaid"],
    ["partially_paid", "Partially paid"],
    ["overdue", "Overdue"],
    ["paid", "Paid"],
    ["cancelled", "Cancelled"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ReceiptText}
        title={t("invoices_title", { defaultMessage: "Invoices" })}
        description={t("invoices_desc", { defaultMessage: "Subscription invoices for every company. Payments are recorded manually." })}
        actions={(
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/billing/invoices/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_invoice", { defaultMessage: "New invoice" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("drafts_to_review", { defaultMessage: "Drafts to review" })} value={counts.draft} theme="grey" icon={FileClock} onClick={() => setTab("draft")} />
        <StatCard title={t("awaiting_payment", { defaultMessage: "Awaiting payment" })} value={counts.unpaid + counts.partially_paid} theme="amber" icon={Wallet} onClick={() => setTab("unpaid")} />
        <StatCard title={t("overdue", { defaultMessage: "Overdue" })} value={counts.overdue} theme="red" icon={AlertTriangle} onClick={() => setTab("overdue")} />
        <StatCard
          title={t("outstanding", { defaultMessage: "Outstanding" })}
          value={outstanding.length ? outstanding.map(([code, amount]) => formatMoney(amount, code)).join(" · ") : "—"}
          theme="purple"
          icon={CheckCircle2}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              tab === id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {t(id === ALL ? "all" : id, { defaultMessage: label })} · {counts[id]}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="w-56 pl-9"
              placeholder={t("search_invoices", { defaultMessage: "Number or company" })}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("all_currencies", { defaultMessage: "All" })}</SelectItem>
              {BILLING_CURRENCIES.map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">{t("loading", { defaultMessage: "Loading..." })}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={t("no_invoices", { defaultMessage: "No invoices" })}
          description={t("no_invoices_desc", { defaultMessage: "Paid subscriptions create draft invoices automatically. You can also create one manually." })}
          actionLabel={t("new_invoice", { defaultMessage: "New invoice" })}
          onAction={() => router.push("/billing/invoices/create")}
        />
      ) : (
        <div className="glass-panel overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-white/5">
                <th className="px-4 py-3">{t("invoice_number", { defaultMessage: "Invoice" })}</th>
                <th className="px-4 py-3">{t("company", { defaultMessage: "Company" })}</th>
                <th className="px-4 py-3">{t("billing_period", { defaultMessage: "Period" })}</th>
                <th className="px-4 py-3">{t("due_date", { defaultMessage: "Due" })}</th>
                <th className="px-4 py-3">{t("status", { defaultMessage: "Status" })}</th>
                <th className="px-4 py-3 text-right">{t("total", { defaultMessage: "Total" })}</th>
                <th className="px-4 py-3 text-right">{t("balance_due", { defaultMessage: "Balance" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-slate-100 transition hover:bg-violet-50/50 dark:border-white/5 dark:hover:bg-white/5"
                  onClick={() => router.push(`/billing/invoices/${row.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{row.invoice_number || t("draft", { defaultMessage: "Draft" })}</p>
                    <p className="text-xs text-slate-400">{row.plan_name || t("custom_invoice", { defaultMessage: "Custom" })}</p>
                  </td>
                  <td className="px-4 py-3">{row.company_name || "—"}</td>
                  <td className="px-4 py-3 text-xs">{row.period_start ? `${formatDay(row.period_start)} → ${formatDay(row.period_end)}` : "—"}</td>
                  <td className="px-4 py-3 text-xs">{formatDay(row.due_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge value={row.status} />
                      {row.status === "issued" && <StatusBadge value={row.payment_status} />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(row.total, row.currency)}</td>
                  <td className={cn("px-4 py-3 text-right font-semibold", row.payment_status === "overdue" ? "text-rose-600" : "text-slate-900 dark:text-white")}>
                    {row.status === "issued" ? formatMoney(row.balance_due, row.currency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
