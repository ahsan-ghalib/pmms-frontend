"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, Landmark, MapPin, Plus, Store, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function PropertiesTable() {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const canCreate = [Roles.SUPER_ADMIN, Roles.COMPANY_ADMIN].includes(role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await propertiesApi.list({ search: search || undefined, include_archived: true });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("properties_load_failed", { defaultMessage: "Failed to load properties" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const stats = useMemo(() => ({
    total: rows.filter((row) => !row.archived_at).length,
    active: rows.filter((row) => row.status === "active" && !row.archived_at).length,
    villa: rows.filter((row) => row.type === "villa" && !row.archived_at).length,
    apartment: rows.filter((row) => row.type === "apartment" && !row.archived_at).length,
    office: rows.filter((row) => row.type === "office" && !row.archived_at).length,
    shopping: rows.filter((row) => row.type === "shopping_complex" && !row.archived_at).length,
    pinned: rows.filter((row) => row.latitude && row.longitude && !row.archived_at).length,
    archived: rows.filter((row) => row.archived_at).length,
    locations: rows.reduce((sum, row) => sum + (Number(row.locations_count) || 0), 0),
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active" && !row.archived_at);
    if (filter === "inactive") return rows.filter((row) => row.status === "inactive" && !row.archived_at);
    if (filter === "archived") return rows.filter((row) => row.archived_at);
    if (filter === "pinned") return rows.filter((row) => row.latitude && row.longitude && !row.archived_at);
    if (["villa", "apartment", "office", "shopping_complex"].includes(filter)) {
      return rows.filter((row) => row.type === filter && !row.archived_at);
    }
    return rows.filter((row) => !row.archived_at);
  }, [rows, filter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "villa", label: t("prop_type_villa", { defaultMessage: "Villa" }), count: stats.villa },
    { id: "apartment", label: t("prop_type_apartment", { defaultMessage: "Apartment" }), count: stats.apartment },
    { id: "office", label: t("prop_type_office", { defaultMessage: "Office" }), count: stats.office },
    { id: "shopping_complex", label: t("prop_type_shopping_complex", { defaultMessage: "Shopping complex" }), count: stats.shopping },
    { id: "pinned", label: t("pinned", { defaultMessage: "Pinned" }), count: stats.pinned },
    { id: "archived", label: t("archived", { defaultMessage: "Archived" }), count: stats.archived },
  ];

  const columns = [
    {
      accessorKey: "name",
      header: t("property", { defaultMessage: "Property" }),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{row.original.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: t("type", { defaultMessage: "Type" }),
      cell: ({ row }) => row.original.type_label || labelize(row.original.type),
    },
    {
      accessorKey: "company_name",
      header: t("company", { defaultMessage: "Company" }),
      cell: ({ row }) => row.original.company_name || "—",
    },
    {
      id: "address",
      header: t("address", { defaultMessage: "Address" }),
      cell: ({ row }) => {
        const address = row.original.address;
        if (!address) return "—";
        return [address.line_1, address.city, address.country].filter(Boolean).join(", ") || "—";
      },
    },
    {
      accessorKey: "locations_count",
      header: t("hierarchy", { defaultMessage: "Hierarchy" }),
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {t("prop_hierarchy_counts", {
            defaultMessage: "{locations} loc · {subs} sub",
            locations: row.original.locations_count ?? 0,
            subs: row.original.sub_locations_count ?? 0,
          })}
        </span>
      ),
    },
    {
      id: "maps",
      header: t("maps", { defaultMessage: "Maps" }),
      cell: ({ row }) => row.original.maps_url ? (
        <a href={row.original.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
          <MapPin className="h-3.5 w-3.5" /> {t("open_maps", { defaultMessage: "Open maps" })}
        </a>
      ) : <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "status",
      header: t("status", { defaultMessage: "Status" }),
      cell: ({ row }) => <StatusBadge value={row.original.archived_at ? "archived" : row.original.status} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/properties/${row.original.id}`)}>
            <Eye className="mr-2 h-4 w-4" /> {t("open", { defaultMessage: "Open" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Landmark}
        title={t("properties", { defaultMessage: "Properties" })}
        description={t("properties_desc", { defaultMessage: "Company → property → location → sub-location → unit." })}
        actions={canCreate && (
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/properties/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_property", { defaultMessage: "New property" })}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard title={t("properties", { defaultMessage: "Properties" })} value={stats.total} theme="indigo" icon={Landmark} onClick={() => setFilter("all")} />
        <StatCard title={t("prop_type_villa", { defaultMessage: "Villa" })} value={stats.villa} theme="purple" icon={Landmark} onClick={() => setFilter("villa")} />
        <StatCard title={t("prop_type_apartment", { defaultMessage: "Apartment" })} value={stats.apartment} theme="blue" icon={Building2} onClick={() => setFilter("apartment")} />
        <StatCard title={t("prop_type_office", { defaultMessage: "Office" })} value={stats.office} theme="cyan" icon={Warehouse} onClick={() => setFilter("office")} />
        <StatCard title={t("prop_type_shopping_complex", { defaultMessage: "Shopping complex" })} value={stats.shopping} theme="amber" icon={Store} onClick={() => setFilter("shopping_complex")} />
        <StatCard title={t("pinned", { defaultMessage: "Pinned" })} value={stats.pinned} theme="teal" icon={MapPin} onClick={() => setFilter("pinned")} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === item.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <TableToolbar config={{ search: { placeholder: t("search_properties", { defaultMessage: "Search properties..." }), value: search, onChange: setSearch } }} />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
    </div>
  );
}
