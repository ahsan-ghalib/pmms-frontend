"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, PackageMinus, PackagePlus, Search, UserCog } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import PartLines, { EMPTY_LINE, validLines } from "@/components/inventory/part-lines";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useCan } from "@/hooks/use-module-access";

const EMPTY_MOVE = { mode: null, stock_location_id: "", notes: "", lines: [{ ...EMPTY_LINE }] };

export default function TechnicianHandStock() {
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const isSuper = role === Roles.SUPER_ADMIN;
  const canManage = useCan()("Add Inventory");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [technicians, setTechnicians] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ items: [], logs: [] });
  const [search, setSearch] = useState("");
  const [parts, setParts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [move, setMove] = useState(EMPTY_MOVE);
  const [saving, setSaving] = useState(false);

  const scope = (extra = {}) => (companyId ? { company_id: companyId, ...extra } : extra);

  const load = async (technicianId = selected, company = companyId) => {
    try {
      const params = { ...(company ? { company_id: company } : {}), ...(technicianId ? { technician_id: technicianId } : {}) };
      const data = await inventoryApi.handStock(params);
      setTechnicians(data?.technicians || []);
      setDetail({ items: data?.items || [], logs: data?.logs || [] });
    } catch (error) {
      toast.error(apiError(error, t("hand_stock_load_failed", { defaultMessage: "Failed to load hand stock" })));
    }
  };

  const loadCatalog = (company = companyId) => {
    const params = company ? { company_id: company } : {};
    inventoryApi.parts({ ...params, status: "active" }).then((data) => setParts(Array.isArray(data) ? data : [])).catch(() => {});
    inventoryApi.locations(params).then((data) => setLocations((Array.isArray(data) ? data : []).filter((row) => row.status === "active"))).catch(() => {});
  };

  useEffect(() => {
    if (isSuper) {
      companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
    } else if (role) {
      load(null, "");
      loadCatalog("");
    }
  }, [isSuper, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTechnician = (id) => {
    setSelected(id);
    load(id);
  };

  const stats = useMemo(() => ({
    technicians: technicians.length,
    holding: technicians.filter((row) => Number(row.total_quantity) > 0).length,
    units: technicians.reduce((sum, row) => sum + Number(row.total_quantity || 0), 0),
  }), [technicians]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? technicians.filter((row) => `${row.name} ${row.email || ""}`.toLowerCase().includes(needle)) : technicians;
  }, [technicians, search]);

  const technician = technicians.find((row) => String(row.id) === String(selected));

  const options = move.mode === "return"
    ? detail.items.map((item) => ({ id: item.part_id, label: `${item.name} (${item.sku})`, max: item.quantity }))
    : parts.map((part) => ({ id: part.id, label: `${part.name} (${part.sku}) · ${t("in_store", { defaultMessage: "in store" })} ${part.on_hand ?? 0}` }));

  const openMove = (mode) => setMove({
    ...EMPTY_MOVE,
    mode,
    lines: [{ ...EMPTY_LINE }],
    stock_location_id: locations.length === 1 ? locations[0].id : "",
  });

  const submitMove = async () => {
    const items = validLines(move.lines);
    if (!move.stock_location_id) {
      toast.error(t("select_stock_location", { defaultMessage: "Select a stock location" }));
      return;
    }
    if (items.length === 0) {
      toast.error(t("add_at_least_one_part", { defaultMessage: "Add at least one part with a quantity" }));
      return;
    }
    setSaving(true);
    try {
      const payload = scope({ technician_id: Number(selected), stock_location_id: move.stock_location_id, notes: move.notes || undefined, items });
      if (move.mode === "return") {
        await inventoryApi.returnFromTechnician(payload);
        toast.success(t("hand_stock_returned", { defaultMessage: "Parts returned to store" }));
      } else {
        await inventoryApi.issueToTechnician(payload);
        toast.success(t("hand_stock_issued", { defaultMessage: "Parts issued to technician" }));
      }
      setMove(EMPTY_MOVE);
      await load();
      loadCatalog();
    } catch (error) {
      toast.error(apiError(error, t("action_failed", { defaultMessage: "Action failed" })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={UserCog}
        title={t("technician_hand_stock", { defaultMessage: "Technician hand stock" })}
        description={t("technician_hand_stock_desc", { defaultMessage: "Parts carried by each technician. Issue from the store or return to the store — these parts are not linked to any work order until the technician uses them." })}
        actions={isSuper ? (
          <select
            className="h-10 rounded-md border bg-transparent px-3 text-sm"
            value={companyId}
            onChange={(event) => {
              const id = event.target.value;
              setCompanyId(id);
              setSelected(null);
              setDetail({ items: [], logs: [] });
              if (id) { load(null, id); loadCatalog(id); } else { setTechnicians([]); }
            }}
          >
            <option value="">{t("company", { defaultMessage: "Company" })}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        ) : null}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("technicians", { defaultMessage: "Technicians" })} value={stats.technicians} theme="indigo" icon={UserCog} />
        <StatCard title={t("holding_stock", { defaultMessage: "Holding stock" })} value={stats.holding} theme="green" icon={PackagePlus} />
        <StatCard title={t("units_in_hand", { defaultMessage: "Units in hand" })} value={stats.units} theme="amber" icon={PackageMinus} />
      </div>

      {isSuper && !companyId ? (
        <p className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-400">{t("select_company_first", { defaultMessage: "Select a company first." })}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <section className="glass-panel space-y-3 rounded-2xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder={t("search_technician", { defaultMessage: "Search technician" })} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="max-h-[560px] space-y-1 overflow-auto">
              {visible.length === 0 && <p className="p-4 text-center text-sm text-slate-400">{t("no_technicians", { defaultMessage: "No technicians found" })}</p>}
              {visible.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => selectTechnician(row.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${String(row.id) === String(selected) ? "bg-violet-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{row.name}</span>
                    <span className={`block text-xs ${String(row.id) === String(selected) ? "text-violet-100" : "text-slate-500"}`}>
                      {t("parts_count", { defaultMessage: "{count} parts", count: row.parts_count })}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{row.total_quantity}</span>
                </button>
              ))}
            </div>
          </section>

          {!technician ? (
            <section className="glass-panel flex items-center justify-center rounded-2xl p-10 text-sm text-slate-400">
              {t("select_technician_hint", { defaultMessage: "Select a technician to view and manage their hand stock." })}
            </section>
          ) : (
            <div className="space-y-5">
              <section className="glass-panel space-y-4 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{technician.name}</p>
                    <p className="text-sm text-slate-500">{technician.email || technician.phone || ""}</p>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => openMove("issue")}>
                        <PackagePlus className="mr-2 h-4 w-4" />{t("issue_parts", { defaultMessage: "Issue parts" })}
                      </Button>
                      <Button variant="outline" disabled={detail.items.length === 0} onClick={() => openMove("return")}>
                        <PackageMinus className="mr-2 h-4 w-4" />{t("return_to_store", { defaultMessage: "Return to store" })}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2">{t("part", { defaultMessage: "Part" })}</th>
                        <th className="pb-2">{t("sku", { defaultMessage: "SKU" })}</th>
                        <th className="pb-2 text-right">{t("in_hand", { defaultMessage: "In hand" })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-slate-400">{t("no_hand_stock", { defaultMessage: "This technician is not holding any parts." })}</td></tr>
                      ) : detail.items.map((item) => (
                        <tr key={item.part_id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{item.name}</td>
                          <td className="py-2 font-mono text-xs">{item.sku}</td>
                          <td className="py-2 text-right font-semibold">{item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit_of_measure}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="glass-panel rounded-2xl p-5">
                <p className="mb-3 font-semibold">{t("recent_movements", { defaultMessage: "Recent movements" })}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2">{t("when", { defaultMessage: "When" })}</th>
                        <th className="pb-2">{t("type", { defaultMessage: "Type" })}</th>
                        <th className="pb-2">{t("part", { defaultMessage: "Part" })}</th>
                        <th className="pb-2">{t("qty", { defaultMessage: "Qty" })}</th>
                        <th className="pb-2">{t("reference", { defaultMessage: "Reference" })}</th>
                        <th className="pb-2">{t("user", { defaultMessage: "User" })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.logs.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-slate-400">{t("no_transactions", { defaultMessage: "No transactions yet" })}</td></tr>
                      ) : detail.logs.map((row) => (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="py-2">{formatDate(row.created_at)}</td>
                          <td className="py-2"><StatusBadge value={row.transaction_label || row.transaction_type} /></td>
                          <td className="py-2">{row.part_name} <span className="font-mono text-xs text-slate-500">{row.sku}</span></td>
                          <td className={Number(row.signed_quantity) < 0 ? "py-2 text-rose-600" : "py-2 text-emerald-700"}>{row.signed_quantity}</td>
                          <td className="py-2">
                            {row.work_order_id
                              ? <Link className="text-violet-600 underline" href={`/work-orders/${row.work_order_id}`}>{row.work_order_no || t("work_order", { defaultMessage: "Work order" })}</Link>
                              : row.location_name || "—"}
                          </td>
                          <td className="py-2">{row.user_name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      <Dialog open={Boolean(move.mode)} onOpenChange={(open) => !open && setMove(EMPTY_MOVE)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {move.mode === "return"
                ? t("return_parts_from", { defaultMessage: "Return parts from {name}", name: technician?.name || "" })
                : t("issue_parts_to", { defaultMessage: "Issue parts to {name}", name: technician?.name || "" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{move.mode === "return" ? t("return_to_location", { defaultMessage: "Return to store" }) : t("issue_from_location", { defaultMessage: "Issue from store" })}</p>
              <select
                className="h-10 w-full rounded-md border bg-transparent px-3 text-sm"
                value={move.stock_location_id}
                onChange={(event) => setMove((current) => ({ ...current, stock_location_id: event.target.value }))}
              >
                <option value="">{t("select_stock_location", { defaultMessage: "Select a stock location" })}</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
              {locations.length === 0 && (
                <p className="text-xs text-slate-500">
                  {t("no_stock_locations_hint", { defaultMessage: "No stock locations yet." })}{" "}
                  <Link href="/settings/stock-locations" className="font-medium text-violet-600 underline">{t("add_stock_location", { defaultMessage: "Add location" })}</Link>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("parts", { defaultMessage: "Parts" })}</p>
              <PartLines
                options={options}
                lines={move.lines}
                onChange={(lines) => setMove((current) => ({ ...current, lines }))}
                emptyText={t("no_parts_available", { defaultMessage: "No parts available." })}
              />
            </div>
            <Textarea
              placeholder={t("notes_optional", { defaultMessage: "Notes (optional)" })}
              value={move.notes}
              onChange={(event) => setMove((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMove(EMPTY_MOVE)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving} onClick={submitMove}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {move.mode === "return" ? t("return_to_store", { defaultMessage: "Return to store" }) : t("issue_parts", { defaultMessage: "Issue parts" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
