"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import StatCard from "@/components/common/stat-card";
import PageHeader from "@/components/pmms/page-header";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { workOrdersApi } from "@/services/work-orders/work-orders-api";
import { apiError, formatDay, labelize } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { isManager } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";

const STATUSES = ["created", "assigned", "in_progress", "on_hold", "completed", "verified", "closed", "cancelled"];

export default function WorkOrdersTable() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await workOrdersApi.list(status ? { status } : {});
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load work orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    return rows.filter((row) => `${row.work_order_no} ${row.description || ""}`.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  const columns = [
    { accessorKey: "work_order_no", header: "Number", cell: ({ row }) => <span className="font-bold text-violet-700">{row.original.work_order_no}</span> },
    { accessorKey: "source_type", header: "Source", cell: ({ row }) => labelize(row.original.source_type) },
    { accessorKey: "type", header: "Type", cell: ({ row }) => <PriorityBadge value={row.original.type} /> },
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => <PriorityBadge value={row.original.priority} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { accessorKey: "scheduled_date", header: "Schedule", cell: ({ row }) => formatDay(row.original.scheduled_date) },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/work-orders/${row.original.id}`)}>
            <Eye className="h-4 w-4 mr-2" /> Open
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={ClipboardList}
        title={t("work_orders", { defaultMessage: "Work Orders" })}
        description={t("work_orders_desc", { defaultMessage: "Assign crews, track progress, and close jobs with a full audit trail." })}
        actions={
          isManager(session?.user?.role) && (
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/work-orders/create")}>
              <Plus className="h-4 w-4 mr-2" /> {t("manual_work_order", { defaultMessage: "Manual work order" })}
            </Button>
          )
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t("open", { defaultMessage: "Open" })} value={rows.filter((row) => !["closed", "cancelled"].includes(row.status)).length} theme="purple" />
        <StatCard title={t("in_progress", { defaultMessage: "In progress" })} value={rows.filter((row) => row.status === "in_progress").length} theme="blue" />
        <StatCard title={t("on_hold", { defaultMessage: "On hold" })} value={rows.filter((row) => row.status === "on_hold").length} theme="amber" />
        <StatCard title={t("closed", { defaultMessage: "Closed" })} value={rows.filter((row) => row.status === "closed").length} theme="green" />
      </div>
      <TableToolbar
        config={{
          search: { placeholder: t("search_work_orders", { defaultMessage: "Search work orders..." }), value: search, onChange: setSearch },
          filters: [{
            key: "status",
            placeholder: "Status",
            value: status,
            onChange: (value) => setStatus(value === "all" ? "" : value),
            options: STATUSES.map((value) => ({ value, label: labelize(value) })),
          }],
        }}
      />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} />
    </>
  );
}
