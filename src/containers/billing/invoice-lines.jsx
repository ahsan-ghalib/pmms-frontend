"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyDecimals, formatMoney } from "@/lib/pmms";

export const EMPTY_LINE = { description: "", quantity: "1", unit_price: "" };

export function roundMoney(value, currency) {
  const factor = 10 ** currencyDecimals(currency);
  return Math.round((Number(value) || 0) * factor) / factor;
}

export function computeTotals({ lines, discountType, discountValue, taxRate, currency }) {
  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + roundMoney((Number(line.quantity) || 0) * (Number(line.unit_price) || 0), currency), 0),
    currency
  );
  const value = Number(discountValue) || 0;
  let discount = 0;
  if (discountType === "percent") discount = (subtotal * Math.min(value, 100)) / 100;
  if (discountType === "fixed") discount = Math.min(value, subtotal);
  discount = roundMoney(discount, currency);
  const taxable = roundMoney(subtotal - discount, currency);
  const tax = roundMoney((taxable * (Number(taxRate) || 0)) / 100, currency);
  return { subtotal, discount, tax, total: roundMoney(taxable + tax, currency) };
}

export function linesFromInvoice(invoice) {
  const items = invoice?.items || [];
  return items.length
    ? items.map((item) => ({ description: item.description, quantity: String(item.quantity), unit_price: String(item.unit_price) }))
    : [{ ...EMPTY_LINE }];
}

export function linesPayload(lines) {
  return lines
    .filter((line) => line.description.trim() !== "")
    .map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity) || 1,
      unit_price: Number(line.unit_price) || 0,
    }));
}

export function InvoiceLinesEditor({ lines, onChange, currency, t }) {
  const update = (index, key, value) => onChange(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  const step = currencyDecimals(currency) === 3 ? "0.001" : "0.01";

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[1fr_90px_140px_120px_40px] gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 md:grid">
        <span>{t("description", { defaultMessage: "Description" })}</span>
        <span>{t("qty", { defaultMessage: "Qty" })}</span>
        <span>{t("unit_price", { defaultMessage: "Unit price" })}</span>
        <span className="text-right">{t("amount", { defaultMessage: "Amount" })}</span>
        <span />
      </div>
      {lines.map((line, index) => (
        <div key={index} className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_90px_140px_120px_40px] md:items-center">
          <Input
            className="col-span-2 md:col-span-1"
            placeholder={t("line_description", { defaultMessage: "e.g. Professional plan – monthly" })}
            value={line.description}
            onChange={(event) => update(index, "description", event.target.value)}
          />
          <Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => update(index, "quantity", event.target.value)} />
          <Input type="number" min="0" step={step} value={line.unit_price} onChange={(event) => update(index, "unit_price", event.target.value)} />
          <p className="text-right text-sm font-semibold text-slate-900 dark:text-white">
            {formatMoney(roundMoney((Number(line.quantity) || 0) * (Number(line.unit_price) || 0), currency), currency)}
          </p>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-rose-600"
            disabled={lines.length === 1}
            onClick={() => onChange(lines.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...lines, { ...EMPTY_LINE }])}>
        <Plus className="mr-1 h-3.5 w-3.5" /> {t("add_line", { defaultMessage: "Add line" })}
      </Button>
    </div>
  );
}

export function AdjustmentFields({ value, onChange, t }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>{t("discount", { defaultMessage: "Discount" })}</Label>
        <Select value={value.discount_type || "none"} onValueChange={(next) => set("discount_type", next)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("no_discount", { defaultMessage: "No discount" })}</SelectItem>
            <SelectItem value="percent">{t("discount_percent", { defaultMessage: "Percentage (%)" })}</SelectItem>
            <SelectItem value="fixed">{t("discount_fixed", { defaultMessage: "Fixed amount" })}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("discount_value", { defaultMessage: "Discount value" })}</Label>
        <Input
          type="number"
          min="0"
          step="0.001"
          disabled={(value.discount_type || "none") === "none"}
          value={value.discount_value ?? ""}
          onChange={(event) => set("discount_value", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("tax_rate_percent_short", { defaultMessage: "Tax rate (%)" })}</Label>
        <Input type="number" min="0" max="100" step="0.01" value={value.tax_rate ?? ""} onChange={(event) => set("tax_rate", event.target.value)} />
      </div>
    </div>
  );
}

export function adjustmentsPayload(value) {
  const discountType = value.discount_type && value.discount_type !== "none" ? value.discount_type : null;
  return {
    discount_type: discountType,
    discount_value: discountType && value.discount_value !== "" ? Number(value.discount_value) : null,
    tax_rate: value.tax_rate === "" || value.tax_rate == null ? null : Number(value.tax_rate),
  };
}

export function TotalsSummary({ totals, currency, t, extra = [] }) {
  const rows = [
    ["subtotal", "Subtotal", totals.subtotal],
    ["discount", "Discount", totals.discount ? -totals.discount : 0],
    ["tax", "Tax", totals.tax],
    ...extra,
  ];

  return (
    <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
      {rows.map(([key, fallback, amount]) => (
        <div key={key} className="flex justify-between text-slate-600 dark:text-slate-300">
          <span>{t(key, { defaultMessage: fallback })}</span>
          <span>{formatMoney(amount, currency)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900 dark:border-white/10 dark:text-white">
        <span>{t("total", { defaultMessage: "Total" })}</span>
        <span>{formatMoney(totals.total, currency)}</span>
      </div>
    </div>
  );
}
