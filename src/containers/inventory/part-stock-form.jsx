"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const EMPTY_TXN = { stock_location_id: "", transaction_type: "receive", quantity: "1", notes: "" };

export default function PartStockForm() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const [part, setPart] = useState(null);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [txn, setTxn] = useState(EMPTY_TXN);
  const [saving, setSaving] = useState(false);

  const loadPart = async () => {
    const [partData, logData] = await Promise.all([inventoryApi.showPart(id), inventoryApi.logs({ part_id: id })]);
    setPart(partData);
    setLogs(Array.isArray(logData) ? logData : []);
  };

  useEffect(() => {
    loadPart().catch((error) => toast.error(apiError(error, t("part_load_failed", { defaultMessage: "Failed to load part" }))));
    inventoryApi.locations().then((data) => {
      const rows = (Array.isArray(data) ? data : []).filter((row) => row.status === "active");
      setLocations(rows);
      if (rows.length === 1) setTxn((current) => ({ ...current, stock_location_id: rows[0].id }));
    }).catch(() => {});
    inventoryApi.options().then((data) => setTypes(data?.transaction_types || [])).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const record = async (event) => {
    event.preventDefault();
    if (!txn.stock_location_id) {
      toast.error(t("select_stock_location", { defaultMessage: "Select a stock location" }));
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.transact({
        part_id: id,
        stock_location_id: txn.stock_location_id,
        transaction_type: txn.transaction_type,
        quantity: Number(txn.quantity),
        notes: txn.notes || undefined,
      });
      toast.success(t("transaction_recorded", { defaultMessage: "Transaction recorded" }));
      setTxn((current) => ({ ...EMPTY_TXN, stock_location_id: current.stock_location_id }));
      await loadPart();
    } catch (error) {
      toast.error(apiError(error, t("transaction_failed", { defaultMessage: "Unable to record transaction" })));
    } finally {
      setSaving(false);
    }
  };

  if (!part) return <div className="p-8 text-center text-muted-foreground">{t("loading", { defaultMessage: "Loading..." })}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ArrowLeftRight}
        title={t("manage_stock_for", { defaultMessage: "Manage stock · {name}", name: part.name })}
        description={part.sku}
        actions={<Button variant="outline" onClick={() => router.push(`/inventory/parts/${id}`)}>{t("back_to_part", { defaultMessage: "Back to part" })}</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">{t("on_hand", { defaultMessage: "On hand" })}</p>
          <p className={part.is_low ? "mt-1 text-2xl font-semibold text-rose-600" : "mt-1 text-2xl font-semibold"}>
            {part.on_hand ?? 0} <span className="text-sm font-normal text-slate-500">{part.unit_of_measure}</span>
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">{t("min_stock", { defaultMessage: "Minimum" })}</p>
          <p className="mt-1 text-2xl font-semibold">{part.minimum_stock ?? 0}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-slate-400">{t("status", { defaultMessage: "Status" })}</p>
          <div className="mt-2">{part.is_low ? <StatusBadge value="low stock" /> : <StatusBadge value="ok" />}</div>
        </div>
      </div>

      <form onSubmit={record} className="glass-panel space-y-4 rounded-2xl p-6">
        <p className="font-semibold">{t("record_transaction", { defaultMessage: "Record transaction" })}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label={t("location", { defaultMessage: "Location" })}
            hint={locations.length === 0 ? (
              <>
                {t("no_stock_locations_hint", { defaultMessage: "No stock locations yet." })}{" "}
                <Link href="/settings/stock-locations" className="font-medium text-violet-600 underline">
                  {t("add_stock_location", { defaultMessage: "Add location" })}
                </Link>
              </>
            ) : null}
          >
            <Select value={txn.stock_location_id} onValueChange={(value) => setTxn((current) => ({ ...current, stock_location_id: value }))}>
              <SelectTrigger className="h-10 w-full"><SelectValue placeholder={t("select_stock_location", { defaultMessage: "Select a stock location" })} /></SelectTrigger>
              <SelectContent>
                {locations.map((location) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("type", { defaultMessage: "Type" })}>
            <Select value={txn.transaction_type} onValueChange={(value) => setTxn((current) => ({ ...current, transaction_type: value }))}>
              <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((type) => <SelectItem key={type.value || type} value={type.value || type}>{type.label || type}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={t("quantity", { defaultMessage: "Quantity" })}
            hint={txn.transaction_type === "adjust" ? t("adjust_quantity_hint", { defaultMessage: "Use a negative number to reduce stock." }) : null}
          >
            <Input type="number" step="0.001" value={txn.quantity} onChange={(event) => setTxn((current) => ({ ...current, quantity: event.target.value }))} />
          </Field>
          <div className="md:col-span-3">
            <Field label={t("notes", { defaultMessage: "Notes" })}>
              <Input value={txn.notes} onChange={(event) => setTxn((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !txn.quantity} className="bg-violet-600 hover:bg-violet-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("record_transaction", { defaultMessage: "Record transaction" })}
          </Button>
        </div>
      </form>

      <section className="glass-panel rounded-2xl p-6">
        <p className="mb-3 font-semibold">{t("recent_transactions", { defaultMessage: "Recent transactions" })}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="pb-2">{t("when", { defaultMessage: "When" })}</th>
                <th className="pb-2">{t("type", { defaultMessage: "Type" })}</th>
                <th className="pb-2">{t("qty", { defaultMessage: "Qty" })}</th>
                <th className="pb-2">{t("location", { defaultMessage: "Location" })}</th>
                <th className="pb-2">{t("user", { defaultMessage: "User" })}</th>
                <th className="pb-2">{t("notes", { defaultMessage: "Notes" })}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center text-slate-400">{t("no_transactions", { defaultMessage: "No transactions yet" })}</td></tr>
              ) : logs.slice(0, 20).map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2">{formatDate(row.created_at)}</td>
                  <td className="py-2"><StatusBadge value={row.transaction_label || row.transaction_type} /></td>
                  <td className={Number(row.signed_quantity) < 0 ? "py-2 text-rose-600" : "py-2 text-emerald-700"}>{row.signed_quantity}</td>
                  <td className="py-2">{row.location_name || "—"}</td>
                  <td className="py-2">{row.user_name || "—"}</td>
                  <td className="py-2">{row.notes || row.reference_type || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
