"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useCan } from "@/hooks/use-module-access";

const EMPTY_FORM = { name: "", code: "", property_id: "", company_id: "" };

const toCode = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20);

export default function StockLocationsPage() {
  const t = useT("common");
  const isSuper = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const can = useCan();
  const canAdd = can("Add Inventory");
  const canEdit = can("Edit Inventory");
  const [rows, setRows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async (companyId = form.company_id) => {
    try {
      const params = companyId ? { company_id: companyId } : {};
      const [locations, props] = await Promise.all([inventoryApi.locations(params), propertiesApi.list(params)]);
      setRows(Array.isArray(locations) ? locations : []);
      setProperties(Array.isArray(props) ? props : []);
    } catch (error) {
      toast.error(apiError(error, t("stock_locations_load_failed", { defaultMessage: "Failed to load stock locations" })));
    }
  };

  useEffect(() => {
    if (isSuper) {
      companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
    } else {
      load();
    }
  }, [isSuper]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status !== "active").length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status !== "active");
    return rows;
  }, [rows, filter]);

  const create = async () => {
    if (!form.name || (isSuper && !form.company_id)) return;
    setSaving(true);
    try {
      await inventoryApi.createLocation({
        name: form.name,
        code: form.code || toCode(form.name),
        property_id: form.property_id || null,
        company_id: form.company_id || undefined,
      });
      setForm((current) => ({ ...EMPTY_FORM, company_id: current.company_id }));
      toast.success(t("stock_location_created", { defaultMessage: "Stock location created" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("stock_location_save_failed", { defaultMessage: "Unable to save stock location" })));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await inventoryApi.updateLocation(row.id, { status: row.status === "active" ? "inactive" : "active" });
      await load();
    } catch (error) {
      toast.error(apiError(error, t("stock_location_save_failed", { defaultMessage: "Unable to save stock location" })));
    }
  };

  const selectClass = "h-10 rounded-md border bg-transparent px-3 text-sm";

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Warehouse}
        title={t("stock_locations", { defaultMessage: "Stock locations" })}
        description={t("stock_locations_desc", { defaultMessage: "Stores and warehouses where spare parts are kept. Stock in and out is recorded against a location." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("stock_locations", { defaultMessage: "Stock locations" })} value={stats.total} theme="indigo" icon={Warehouse} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Warehouse} onClick={() => setFilter("active")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Warehouse} onClick={() => setFilter("inactive")} />
      </div>

      {canAdd && (
      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-5">
        {isSuper && (
          <select
            className={selectClass}
            value={form.company_id}
            onChange={(event) => {
              const companyId = event.target.value;
              setForm({ ...EMPTY_FORM, company_id: companyId });
              if (companyId) load(companyId); else { setRows([]); setProperties([]); }
            }}
          >
            <option value="">{t("company", { defaultMessage: "Company" })}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        )}
        <Input placeholder={t("stock_location_name", { defaultMessage: "Name, e.g. Main Store" })} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        <Input placeholder={toCode(form.name) || t("code", { defaultMessage: "Code" })} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: toCode(event.target.value) }))} />
        <select className={selectClass} value={form.property_id} onChange={(event) => setForm((current) => ({ ...current, property_id: event.target.value }))}>
          <option value="">{t("no_property", { defaultMessage: "No property (central store)" })}</option>
          {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
        </select>
        <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving || !form.name || (isSuper && !form.company_id)} onClick={create}>
          {t("add_stock_location", { defaultMessage: "Add location" })}
        </Button>
      </section>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-400">
            {isSuper && !form.company_id
              ? t("select_company_first", { defaultMessage: "Select a company first." })
              : t("no_stock_locations", { defaultMessage: "No stock locations yet. Add your first store above." })}
          </p>
        ) : filtered.map((row) => (
          <div key={row.id} className="glass-panel flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-sm text-slate-500">
                <span className="font-mono">{row.code}</span>
                {row.property?.name ? ` · ${row.property.name}` : ` · ${t("central_store", { defaultMessage: "Central store" })}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={row.status} />
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => toggleStatus(row)}>
                  {row.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
