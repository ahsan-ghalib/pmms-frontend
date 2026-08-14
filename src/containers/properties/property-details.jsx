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
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
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
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN, Roles.PROPERTY_MANAGER].includes(role);
  const canArchive = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN].includes(role);
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
            {canManage && !archived && (
              <Button variant="outline" onClick={() => router.push(`/properties/${tree.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
              </Button>
            )}
            {canManage && !archived && (
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setDialog({ mode: "location" })}>
                <Plus className="mr-2 h-4 w-4" /> {t("add_location", { defaultMessage: "Add location" })}
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
        <StatCard title={t("locations", { defaultMessage: "Locations" })} value={counts.locations} theme="blue" icon={Landmark} />
        <StatCard title={t("sub_locations", { defaultMessage: "Sub-locations" })} value={counts.subs} theme="purple" icon={Landmark} />
        <StatCard title={t("units", { defaultMessage: "Units" })} value={counts.units} theme="teal" icon={Landmark} />
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
            <a href={mapsHref(tree)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline">
              <MapPin className="h-4 w-4" /> {t("open_maps", { defaultMessage: "Open maps" })}
            </a>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("prop_hierarchy", { defaultMessage: "Hierarchy" })}</h2>
            <p className="text-sm text-slate-500">{t("prop_hierarchy_desc", { defaultMessage: "Each child belongs to one parent. Archive a node instead of deleting it so history stays readable." })}</p>
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
          <article key={location.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{location.name}</p>
                  <StatusBadge value={location.archived_at ? "archived" : location.status} />
                </div>
                <p className="font-mono text-xs text-slate-500">{location.code} · {labelize(location.type)}</p>
                {mapsHref(location) && (
                  <a href={mapsHref(location)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-violet-600">
                    <MapPin className="h-3.5 w-3.5" /> {t("open_maps", { defaultMessage: "Open maps" })}
                  </a>
                )}
              </div>
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {!location.archived_at && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "location", node: location })}>{t("edit", { defaultMessage: "Edit" })}</Button>
                      <Button size="sm" variant="outline" onClick={() => setDialog({ mode: "sub", parentId: location.id })}>{t("add_sub_location", { defaultMessage: "Add sub-location" })}</Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => run(() => propertiesApi.archiveLocation(location.id), t("location_archived", { defaultMessage: "Location archived" }))}>{t("archive", { defaultMessage: "Archive" })}</Button>
                    </>
                  )}
                  {location.archived_at && (
                    <Button size="sm" variant="outline" onClick={() => run(() => propertiesApi.restoreLocation(location.id), t("location_restored", { defaultMessage: "Location restored" }))}>{t("restore", { defaultMessage: "Restore" })}</Button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(location.sub_locations || []).map((sub) => (
                <div key={sub.id} className="rounded-xl border border-slate-200/70 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="font-mono text-xs text-slate-500">{sub.code}</p>
                      <StatusBadge value={sub.archived_at ? "archived" : sub.status} />
                    </div>
                    {canManage && !sub.archived_at && (
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "sub", parentId: location.id, node: sub })}>{t("edit", { defaultMessage: "Edit" })}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "unit", parentId: sub.id })}>{t("add_unit", { defaultMessage: "Add unit" })}</Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => run(() => propertiesApi.archiveSubLocation(sub.id), t("sub_location_archived", { defaultMessage: "Sub-location archived" }))}>{t("archive", { defaultMessage: "Archive" })}</Button>
                      </div>
                    )}
                    {canManage && sub.archived_at && (
                      <Button size="sm" variant="ghost" onClick={() => run(() => propertiesApi.restoreSubLocation(sub.id), t("sub_location_restored", { defaultMessage: "Sub-location restored" }))}>{t("restore", { defaultMessage: "Restore" })}</Button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(sub.units || []).map((unit) => (
                      <div key={unit.id} className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs dark:border-violet-500/30 dark:bg-violet-500/10">
                        <span className="font-semibold text-violet-800 dark:text-violet-200">{unit.name}</span>
                        <span className="text-violet-500">{labelize(unit.unit_type)}</span>
                        {canManage && !unit.archived_at && (
                          <>
                            <button type="button" className="font-semibold text-violet-700" onClick={() => setDialog({ mode: "unit", parentId: sub.id, node: unit })}>{t("edit", { defaultMessage: "Edit" })}</button>
                            <button type="button" className="font-semibold text-rose-600" onClick={() => run(() => propertiesApi.archiveUnit(unit.id), t("unit_archived", { defaultMessage: "Unit archived" }))}>{t("archive", { defaultMessage: "Archive" })}</button>
                          </>
                        )}
                        {canManage && unit.archived_at && (
                          <button type="button" className="font-semibold" onClick={() => run(() => propertiesApi.restoreUnit(unit.id), t("unit_restored", { defaultMessage: "Unit restored" }))}>{t("restore", { defaultMessage: "Restore" })}</button>
                        )}
                      </div>
                    ))}
                    {!(sub.units || []).length && <span className="text-xs text-slate-400">{t("no_units", { defaultMessage: "No units" })}</span>}
                  </div>
                </div>
              ))}
              {!(location.sub_locations || []).length && (
                <p className="text-sm text-slate-400">{t("no_sub_locations", { defaultMessage: "No sub-locations under this location." })}</p>
              )}
            </div>
          </article>
        ))}
      </section>

      <PropertyNodeDialog
        open={!!dialog}
        mode={dialog?.mode}
        node={dialog?.node}
        busy={busy}
        onClose={() => setDialog(null)}
        onSubmit={saveNode}
      />
    </div>
  );
}
