"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/data-table";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

const EMPTY_FILTERS = { from: "", to: "", part_id: "", transaction_type: "", user_id: "", work_order_id: "", stock_location_id: "" };
const EMPTY_TXN = { part_id: "", stock_location_id: "", transaction_type: "receive", quantity: "1", notes: "" };

export default function StockLogs() {
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.SUPERVISOR].includes(role);
  const [rows, setRows] = useState([]);
  const [parts, setParts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [types, setTypes] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [txn, setTxn] = useState(EMPTY_TXN);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const data = await inventoryApi.logs(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("logs_load_failed", { defaultMessage: "Failed to load stock logs" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    inventoryApi.parts().then((data) => setParts(Array.isArray(data) ? data : [])).catch(() => {});
    inventoryApi.locations().then((data) => setLocations(Array.isArray(data) ? data : [])).catch(() => {});
    inventoryApi.options().then((data) => setTypes(data?.transaction_types || [])).catch(() => {});
    pmmsUsersApi.list().then((data) => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filters]);

  const stats = useMemo(() => ({
    total: rows.length,
    inbound: rows.filter((row) => Number(row.signed_quantity) > 0).length,
    outbound: rows.filter((row) => Number(row.signed_quantity) < 0).length,
  }), [rows]);

  const record = async () => {
    try {
      await inventoryApi.transact({
        ...txn,
        quantity: Number(txn.quantity),
        notes: txn.notes || undefined,
      });
      toast.success(t("transaction_recorded", { defaultMessage: "Transaction recorded" }));
      setTxn(EMPTY_TXN);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("transaction_failed", { defaultMessage: "Unable to record transaction" })));
    }
  };

  const columns = [
    { accessorKey: "created_at", header: t("when", { defaultMessage: "When" }), cell: ({ row }) => formatDate(row.original.created_at) },
    { accessorKey: "transaction_label", header: t("type", { defaultMessage: "Type" }), cell: ({ row }) => <StatusBadge value={row.original.transaction_label || row.original.transaction_type} /> },
    { id: "part", header: t("part", { defaultMessage: "Part" }), cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.part_name}</p>
        <p className="font-mono text-xs text-slate-500">{row.original.sku}</p>
      </div>
    ) },
    { accessorKey: "signed_quantity", header: t("qty", { defaultMessage: "Qty" }), cell: ({ row }) => (
      <span className={Number(row.original.signed_quantity) < 0 ? "text-rose-600" : "text-emerald-700"}>
        {row.original.signed_quantity}
      </span>
    ) },
    { accessorKey: "location_name", header: t("location", { defaultMessage: "Location" }), cell: ({ row }) => row.original.location_name || "—" },
    { accessorKey: "user_name", header: t("user", { defaultMessage: "User" }), cell: ({ row }) => row.original.user_name || "—" },
    { accessorKey: "notes", header: t("notes", { defaultMessage: "Notes" }), cell: ({ row }) => row.original.notes || row.original.reference_type || "—" },
  ];

  const selectClass = "h-10 w-full rounded-md border px-3 text-sm";

  return (
    <div className="space-y-5">
      <PageHeader
        icon={History}
        title={t("stock_logs", { defaultMessage: "Stock logs" })}
        description={t("stock_logs_desc", { defaultMessage: "Immutable stock-in, stock-out, issue, usage, return, and adjustment history." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("transactions", { defaultMessage: "Transactions" })} value={stats.total} theme="indigo" icon={History} />
        <StatCard title={t("stock_in", { defaultMessage: "Stock in" })} value={stats.inbound} theme="green" icon={ArrowLeftRight} />
        <StatCard title={t("stock_out", { defaultMessage: "Stock out" })} value={stats.outbound} theme="rose" icon={ArrowLeftRight} />
      </div>

      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-4">
        <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
        <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
        <select className={selectClass} value={filters.part_id} onChange={(event) => setFilters((current) => ({ ...current, part_id: event.target.value }))}>
          <option value="">{t("all_parts", { defaultMessage: "All parts" })}</option>
          {parts.map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku})</option>)}
        </select>
        <select className={selectClass} value={filters.transaction_type} onChange={(event) => setFilters((current) => ({ ...current, transaction_type: event.target.value }))}>
          <option value="">{t("all_types", { defaultMessage: "All types" })}</option>
          {types.map((type) => <option key={type.value || type} value={type.value || type}>{type.label || type}</option>)}
        </select>
        <select className={selectClass} value={filters.user_id} onChange={(event) => setFilters((current) => ({ ...current, user_id: event.target.value }))}>
          <option value="">{t("all_users", { defaultMessage: "All users" })}</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <select className={selectClass} value={filters.stock_location_id} onChange={(event) => setFilters((current) => ({ ...current, stock_location_id: event.target.value }))}>
          <option value="">{t("all_locations", { defaultMessage: "All locations" })}</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
        <Input placeholder={t("work_order_id", { defaultMessage: "Work order ID" })} value={filters.work_order_id} onChange={(event) => setFilters((current) => ({ ...current, work_order_id: event.target.value }))} />
        <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>{t("clear_filters", { defaultMessage: "Clear filters" })}</Button>
      </section>

      {canManage && (
        <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-5">
          <select className={selectClass} value={txn.part_id} onChange={(event) => setTxn((current) => ({ ...current, part_id: event.target.value }))}>
            <option value="">{t("part", { defaultMessage: "Part" })}</option>
            {parts.map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku})</option>)}
          </select>
          <select className={selectClass} value={txn.stock_location_id} onChange={(event) => setTxn((current) => ({ ...current, stock_location_id: event.target.value }))}>
            <option value="">{t("location", { defaultMessage: "Location" })}</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <select className={selectClass} value={txn.transaction_type} onChange={(event) => setTxn((current) => ({ ...current, transaction_type: event.target.value }))}>
            {types.map((type) => <option key={type.value || type} value={type.value || type}>{type.label || type}</option>)}
          </select>
          <Input type="number" step="0.001" value={txn.quantity} onChange={(event) => setTxn((current) => ({ ...current, quantity: event.target.value }))} />
          <Input placeholder={t("notes", { defaultMessage: "Notes" })} value={txn.notes} onChange={(event) => setTxn((current) => ({ ...current, notes: event.target.value }))} />
          <div className="md:col-span-5 flex justify-end">
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={record}>{t("record_transaction", { defaultMessage: "Record transaction" })}</Button>
          </div>
        </section>
      )}

      <DataTable columns={columns} data={rows} isLoading={loading} columnsBtn={false} total={rows.length} />
    </div>
  );
}
