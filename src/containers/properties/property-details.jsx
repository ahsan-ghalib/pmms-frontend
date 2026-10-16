"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Landmark, MapPin, Pencil, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useCan } from "@/hooks/use-module-access";
import { cn } from "@/lib/utils";
import PropertyNodeDialog from "./property-node-dialog";

function mapsHref(node) {
  if (node?.maps_url) return node.maps_url;
  if (node?.latitude != null && node?.longitude != null) {
    return `https://www.google.com/maps?q=${node.latitude},${node.longitude}`;
  }
  return null;
}

function addressLine(address) {
  if (!address) return "—";
  return [address.line_1, address.line_2, address.city, address.state, address.country, address.postal_code].filter(Boolean).join(", ") || "—";
}

export default function PropertyDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const can = useCan();
  const canEdit = can("Edit Properties");
  const canArchive = can("Delete Properties");
  const canAddLocation = can("Add Locations");
  const canEditLocation = can("Edit Locations");
  const canArchiveLocation = can("Delete Locations");
  const canAddUnit = can("Add Units");
  const canEditUnit = can("Edit Units");
  const canArchiveUnit = can("Delete Units");
  const [tree, setTree] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async (includeArchived = showArchived) => {
    try {
      setTree(await propertiesApi.tree(id, includeArchived ? { include_archived: true } : {}));
    } catch (error) {
      toast.error(apiError(error, t("property_load_failed", { defaultMessage: "Failed to load property" })));
    }
  };

  useEffect(() => { load(showArchived); }, [id, showArchived]);

  const counts = useMemo(() => {
    const locations = tree?.locations || [];
    const subs = locations.flatMap((location) => location.sub_locations || []);
  const units = subs.flatMap((sub) => sub.units || []);
    return { locations: locations.length, subs: subs.length, units: units.length };
  }, [tree]);
  const levelLabel = (level, fallback) => tree?.property_type?.levels?.find((item) => item.level === level)?.plural_label || tree?.property_type?.levels?.find((item) => item.level === level)?.label || fallback;
  const levelEnabled = (level) => tree?.property_type?.levels?.find((item) => item.level === level)?.enabled !== false;

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      setDialog(null);
      await load(showArchived);
    } catch (error) {
      toast.error(apiError(error, t("property_action_failed", { defaultMessage: "Unable to update hierarchy" })));
    } finally {
      setBusy(false);
    }
  };

  const saveNode = async (values) => {
    const payload = { ...values };
    if (dialog.mode !== "location") delete payload.type;
    if (dialog.mode !== "unit") delete payload.unit_type;
    if (dialog.mode === "unit") {
      delete payload.latitude;
      delete payload.longitude;
    }

    if (dialog.mode === "location") {
      await run(
        () => dialog.node?.id ? propertiesApi.updateLocation(dialog.node.id, payload) : propertiesApi.addLocation(tree.id, payload),
        dialog.node?.id ? t("location_updated", { defaultMessage: "Location updated" }) : t("location_created", { defaultMessage: "Location added" })
      );
    } else if (dialog.mode === "sub") {
      await run(
        () => dialog.node?.id ? propertiesApi.updateSubLocation(dialog.node.id, payload) : propertiesApi.addSubLocation(dialog.parentId, payload),
        dialog.node?.id ? t("sub_location_updated", { defaultMessage: "Sub-location updated" }) : t("sub_location_created", { defaultMessage: "Sub-location added" })
      );
    } else {
      await run(
        () => dialog.node?.id ? propertiesApi.updateUnit(dialog.node.id, payload) : propertiesApi.addUnit(dialog.parentId, payload),
        dialog.node?.id ? t("unit_updated", { defaultMessage: "Unit updated" }) : t("unit_created", { defaultMessage: "Unit added" })
      );
    }
  };

  if (!tree) {
    return <div className="glass-panel h-48 animate-pulse rounded-2xl" />;
  }

  const archived = Boolean(tree.archived_at);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        title={tree.name}
        description={`${tree.code} · ${tree.type_label || labelize(tree.type)} · ${t("prop_breadcrumb", { defaultMessage: "Company → Property → Location → Sub-location → Unit" })}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/properties")}>{t("back", { defaultMessage: "Back" })}</Button>
            {canEdit && !archived && (
              <Button variant="outline" onClick={() => router.push(`/properties/${tree.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
              </Button>
            )}
            {canAddLocation && !archived && (
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setDialog({ mode: "location" })}>
                <Plus className="mr-2 h-4 w-4" /> {t("add_level", { defaultMessage: "Add {label}", label: levelLabel(1, "Location").toLowerCase() })}
              </Button>
            )}
            {canArchive && !archived && (
              <Button variant="destructive" onClick={() => run(() => propertiesApi.archive(tree.id), t("property_archived", { defaultMessage: "Property archived" }))}>
                <Archive className="mr-2 h-4 w-4" /> {t("archive", { defaultMessage: "Archive" })}
              </Button>
            )}
            {canArchive && archived && (
              <Button onClick={() => run(() => propertiesApi.restore(tree.id), t("property_restored", { defaultMessage: "Property restored" }))}>
                <RotateCcw className="mr-2 h-4 w-4" /> {t("restore", { defaultMessage: "Restore" })}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("status", { defaultMessage: "Status" })} value={labelize(archived ? "archived" : tree.status)} theme="indigo" icon={Landmark} />
        <StatCard title={levelLabel(1, t("locations", { defaultMessage: "Locations" }))} value={counts.locations} theme="blue" icon={Landmark} />
        <StatCard title={levelLabel(2, t("sub_locations", { defaultMessage: "Sub-locations" }))} value={counts.subs} theme="purple" icon={Landmark} />
        <StatCard title={levelLabel(3, t("units", { defaultMessage: "Units" }))} value={counts.units} theme="teal" icon={Landmark} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("prop_identity", { defaultMessage: "Identity" })}</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-slate-400">{t("company", { defaultMessage: "Company" })}</dt><dd className="font-medium">{tree.company_name || "—"}</dd></div>
            <div><dt className="text-slate-400">{t("code", { defaultMessage: "Code" })}</dt><dd className="font-mono">{tree.code}</dd></div>
            <div><dt className="text-slate-400">{t("type", { defaultMessage: "Type" })}</dt><dd>{tree.type_label || labelize(tree.type)}</dd></div>
          </dl>
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("address", { defaultMessage: "Address" })}</p>
          <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">{addressLine(tree.address)}</p>
          <p className="mt-3 text-sm text-slate-500">{tree.contact?.name || "—"} · {tree.contact?.phone || "—"}</p>
          <p className="text-sm text-slate-500">{tree.contact?.email || "—"}</p>
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("maps_pin", { defaultMessage: "Maps pin" })}</p>
          <p className="mt-3 font-mono text-sm">{tree.latitude ?? "—"}, {tree.longitude ?? "—"}</p>
          {mapsHref(tree) ? (
            <>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/70 dark:border-white/10">
                <iframe
                  title={t("maps_pin", { defaultMessage: "Maps pin" })}
                  src={`https://maps.google.com/maps?q=${tree.latitude},${tree.longitude}&z=15&output=embed`}
                  className="h-48 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a href={mapsHref(tree)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline">
                <MapPin className="h-4 w-4" /> {t("open_maps", { defaultMessage: "Open maps" })}
              </a>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">{t("prop_maps_empty", { defaultMessage: "Add coordinates to generate a navigation link." })}</p>
          )}
        </section>
      </div>

      {tree.notes && (
        <section className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("notes", { defaultMessage: "Notes" })}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tree.notes}</p>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">01</span><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("prop_hierarchy", { defaultMessage: "Hierarchy" })}</h2>
            <p className="text-sm text-slate-500">{t("prop_hierarchy_desc", { defaultMessage: "Each child belongs to one parent. Archive a node instead of deleting it so history stays readable." })}</p>
            </div></div>
          </div>
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              showArchived ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {showArchived ? t("hide_archived", { defaultMessage: "Hide archived" }) : t("show_archived", { defaultMessage: "Show archived" })}
          </button>
        </div>

        {(tree.locations || []).length === 0 ? (
          <div className="glass-panel px-6 py-12 text-center">
            <p className="font-semibold">{t("no_locations", { defaultMessage: "No locations yet" })}</p>
            <p className="mt-1 text-sm text-slate-500">{t("no_locations_desc", { defaultMessage: "Add a building, wing, or block under this property." })}</p>
          </div>
        ) : (tree.locations || []).map((location) => (
          <article key={location.id} className="group overflow-hidden rounded-2xl border border-blue-200/70 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-blue-100/50 dark:border-blue-400/20 dark:bg-slate-900/50 dark:hover:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 bg-gradient-to-r from-blue-50/80 to-white p-5 dark:from-blue-500/[0.08] dark:to-transparent">
              <div className="flex-1 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">L</span><div><div className="flex items-center gap-2"><p className="font-semibold text-slate-900 dark:text-white">{location.name}</p>
                  <StatusBadge value={location.archived_at ? "archived" : location.status} />
                  </div><p className="mt-1 font-mono text-xs text-slate-500">{location.code} <span className="font-sans">·</span> {labelize(location.type)}</p></div>
                {mapsHref(location) && (
                  <a href={mapsHref(location)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
                    <MapPin className="h-3.5 w-3.5" /> {t("open_maps", { defaultMessage: "Open maps" })}
                  </a>
                )}
              </div></div>
              {(canEditLocation || canArchiveLocation) && (
                <div className="flex flex-wrap gap-2 p-5">
                  {!location.archived_at && (
                    <>
                      {canEditLocation && <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "location", node: location })}>{t("edit", { defaultMessage: "Edit" })}</Button>}
                      {canArchiveLocation && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => run(() => propertiesApi.archiveLocation(location.id), t("location_archived", { defaultMessage: "Location archived" }))}>{t("archive", { defaultMessage: "Archive" })}</Button>}
                    </>
                  )}
                  {location.archived_at && canArchiveLocation && (
                    <Button size="sm" variant="outline" onClick={() => run(() => propertiesApi.restoreLocation(location.id), t("location_restored", { defaultMessage: "Location restored" }))}>{t("restore", { defaultMessage: "Restore" })}</Button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/70 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">02</span><div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{levelLabel(2, t("sub_locations", { defaultMessage: "Sub-locations" }))}</p>
                  <p className="text-xs text-slate-500">{t("sub_locations_desc", { defaultMessage: "Add sub-locations inside this location." })}</p>
                </div></div>
                {!location.archived_at && canAddLocation && levelEnabled(2) && <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "sub", parentId: location.id })}><Plus className="mr-1.5 h-4 w-4" />{t("add_level", { defaultMessage: "Add {label}", label: levelLabel(2, "sub-location").toLowerCase() })}</Button>}
              </div>
              <div className="space-y-3">
              {(location.sub_locations || []).map((sub) => (
                <div key={sub.id} className="relative rounded-xl border border-purple-200/70 bg-white p-4 shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">S</span><div>
                      <p className="font-semibold">{sub.name}</p>
                      <p className="font-mono text-xs text-slate-500">{sub.code}</p>
                      <StatusBadge value={sub.archived_at ? "archived" : sub.status} />
                    </div></div>
                    {(canEditLocation || canAddUnit || canArchiveLocation) && !sub.archived_at && (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-2">
                        {canEditLocation && <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "sub", parentId: location.id, node: sub })}>{t("edit", { defaultMessage: "Edit" })}</Button>}
                        {canAddUnit && <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "unit", parentId: sub.id })}><Plus className="mr-1 h-3.5 w-3.5" />{t("add_level", { defaultMessage: "Add {label}", label: levelLabel(3, "unit").toLowerCase() })}</Button>}
                        </div>
                        {canArchiveLocation && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => run(() => propertiesApi.archiveSubLocation(sub.id), t("sub_location_archived", { defaultMessage: "Sub-location archived" }))}>{t("archive", { defaultMessage: "Archive" })}</Button>}
                      </div>
                    )}
                    {canArchiveLocation && sub.archived_at && (
                      <Button size="sm" variant="ghost" onClick={() => run(() => propertiesApi.restoreSubLocation(sub.id), t("sub_location_restored", { defaultMessage: "Sub-location restored" }))}>{t("restore", { defaultMessage: "Restore" })}</Button>
                    )}
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-[10px] font-bold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">03</span>{levelLabel(3, t("units", { defaultMessage: "Units" }))}</p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {(sub.units || []).map((unit) => (
                      <div key={unit.id} className="group/unit rounded-2xl border border-teal-200/80 bg-gradient-to-br from-white to-teal-50/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-teal-500/30 dark:from-slate-900/70 dark:to-teal-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">U</span>
                            <div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{unit.name}</p><p className="mt-1 truncate font-mono text-[11px] text-slate-500">{unit.code}</p></div>
                          </div>
                          <StatusBadge value={unit.archived_at ? "archived" : unit.status} />
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-teal-100 pt-3 text-xs dark:border-teal-500/20">
                          <div><p className="text-[10px] uppercase tracking-wider text-slate-400">{t("unit_type", { defaultMessage: "Unit type" })}</p><p className="mt-1 font-medium text-slate-700 dark:text-slate-200">{labelize(unit.unit_type) || "—"}</p></div>
                        {(canEditUnit || canArchiveUnit) && !unit.archived_at && (
                          <div className="flex gap-2">{canEditUnit && <button type="button" className="font-semibold text-violet-700 hover:underline" onClick={() => setDialog({ mode: "unit", parentId: sub.id, node: unit })}>{t("edit", { defaultMessage: "Edit" })}</button>}{canArchiveUnit && <button type="button" className="font-semibold text-rose-600 hover:underline" onClick={() => run(() => propertiesApi.archiveUnit(unit.id), t("unit_archived", { defaultMessage: "Unit archived" }))}>{t("archive", { defaultMessage: "Archive" })}</button>}</div>
                        )}
                        {canArchiveUnit && unit.archived_at && (
                          <button type="button" className="font-semibold text-violet-700 hover:underline" onClick={() => run(() => propertiesApi.restoreUnit(unit.id), t("unit_restored", { defaultMessage: "Unit restored" }))}>{t("restore", { defaultMessage: "Restore" })}</button>
                        )}
                        </div>
                      </div>
                    ))}
                    {!(sub.units || []).length && <span className="text-xs text-slate-400">{t("no_units", { defaultMessage: "No units" })}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {!(location.sub_locations || []).length && (
                <p className="text-sm text-slate-400">{t("no_sub_locations", { defaultMessage: "No sub-locations under this location." })}</p>
              )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <PropertyNodeDialog
        open={!!dialog}
        mode={dialog?.mode}
        node={dialog?.node}
        parentCode={dialog?.mode === "location" ? tree?.code : dialog?.mode === "sub" ? tree?.locations?.find((item) => item.id === dialog?.parentId)?.code : tree?.locations?.flatMap((item) => item.sub_locations || []).find((item) => item.id === dialog?.parentId)?.code}
        busy={busy}
        onClose={() => setDialog(null)}
        onSubmit={saveNode}
      />
    </div>
  );
}
