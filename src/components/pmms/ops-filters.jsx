"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/use-t";

export default function OpsFilters({
  filters,
  setFilters,
  onApply,
  properties = [],
  locations = [],
  subLocations = [],
  units = [],
  categories = [],
  services = [],
  technicians = [],
  statuses = [],
  priorities = [],
  showTechnician = true,
  showStatus = true,
  showPriority = true,
}) {
  const t = useT("common");
  const visibleSubLocations = filters.location_id
    ? subLocations.filter((row) => String(row.location_id || row.locationId || "") === String(filters.location_id))
    : subLocations;
  const visibleUnits = filters.sub_location_id
    ? units.filter((row) => String(row.sub_location_id || row.subLocationId || "") === String(filters.sub_location_id))
    : units;
  const set = (key) => (event) => {
    const next = {
      ...filters,
      [key]: event.target.value,
      ...(key === "property_id" ? { location_id: "", sub_location_id: "", unit_id: "" } : {}),
      ...(key === "location_id" ? { sub_location_id: "", unit_id: "" } : {}),
      ...(key === "sub_location_id" ? { unit_id: "" } : {}),
      ...(key === "category_id" ? { service_id: "" } : {}),
    };
    setFilters(next);
    onApply?.(next);
  };

  return (
    <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-4" aria-label={t("filters", { defaultMessage: "Filters" })}>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("from", { defaultMessage: "From" })}</span>
        <Input type="date" value={filters.from || ""} onChange={set("from")} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("to", { defaultMessage: "To" })}</span>
        <Input type="date" value={filters.to || ""} onChange={set("to")} />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("property", { defaultMessage: "Property" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.property_id || ""} onChange={set("property_id")}>
          <option value="">{t("all_properties", { defaultMessage: "All properties" })}</option>
          {properties.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("location", { defaultMessage: "Location" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.location_id || ""} onChange={set("location_id")}>
          <option value="">{t("all_locations", { defaultMessage: "All locations" })}</option>
          {locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("sub_location", { defaultMessage: "Sub-location" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.sub_location_id || ""} onChange={set("sub_location_id")}>
          <option value="">{t("all_sub_locations", { defaultMessage: "All sub-locations" })}</option>
          {visibleSubLocations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("unit", { defaultMessage: "Unit" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.unit_id || ""} onChange={set("unit_id")}>
          <option value="">{t("all_units", { defaultMessage: "All units" })}</option>
          {visibleUnits.map((row) => <option key={row.id} value={row.id}>{row.name || row.unit_no}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("category", { defaultMessage: "Category" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.category_id || ""} onChange={set("category_id")}>
          <option value="">{t("all_categories", { defaultMessage: "All categories" })}</option>
          {categories.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-slate-500">{t("subcategory", { defaultMessage: "Service / subcategory" })}</span>
        <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.service_id || ""} onChange={set("service_id")}>
          <option value="">{t("all_services", { defaultMessage: "All services" })}</option>
          {services.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
        </select>
      </label>
      {showTechnician && (
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("technician", { defaultMessage: "Technician" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.technician_id || ""} onChange={set("technician_id")}>
            <option value="">{t("all_technicians", { defaultMessage: "All technicians" })}</option>
            {technicians.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
      )}
      {showStatus && (
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("status", { defaultMessage: "Status" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.status || ""} onChange={set("status")}>
            <option value="">{t("all_statuses", { defaultMessage: "All statuses" })}</option>
            {statuses.map((row) => <option key={row} value={row}>{row.replaceAll("_", " ")}</option>)}
          </select>
        </label>
      )}
      {showPriority && (
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("priority", { defaultMessage: "Priority" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.priority || ""} onChange={set("priority")}>
            <option value="">{t("all_priorities", { defaultMessage: "All priorities" })}</option>
            {(priorities.length ? priorities : ["normal", "urgent"]).map((row) => (
              <option key={row} value={row}>{row.replaceAll("_", " ")}</option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-end gap-2 md:col-span-2">
        <Button type="button" className="bg-violet-600 hover:bg-violet-700" onClick={() => onApply?.(filters)}>{t("apply", { defaultMessage: "Apply" })}</Button>
        <Button type="button" variant="outline" onClick={() => { setFilters({}); onApply?.({}); }}>{t("clear_filters", { defaultMessage: "Clear" })}</Button>
      </div>
    </section>
  );
}
