"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import StatCard from "@/components/common/stat-card";
import PageHeader from "@/components/pmms/page-header";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function PmmsComplaintsTable() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await complaintsApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load complaints"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = !status || row.status === status;
      const haystack = `${row.reference_no} ${row.description} ${row.property?.name || ""}`.toLowerCase();
      return matchesStatus && haystack.includes(search.toLowerCase());
    });
  }, [rows, search, status]);

  const stats = {
    submitted: rows.filter((row) => row.status === "submitted").length,
    assigned: rows.filter((row) => row.status === "assigned").length,
    in_progress: rows.filter((row) => row.status === "in_progress").length,
    closed: rows.filter((row) => row.status === "closed").length,
  };

  const columns = [
    { accessorKey: "reference_no", header: "Reference", cell: ({ row }) => <span className="font-bold text-violet-700">{row.original.reference_no}</span> },
    { accessorKey: "property", header: "Property", cell: ({ row }) => row.original.property?.name || "—" },
    { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category?.name_en || "—" },
    { accessorKey: "priority", header: "Priority", cell: ({ row }) => <PriorityBadge value={row.original.priority} /> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.status} /> },
    { accessorKey: "submitted_at", header: "Submitted", cell: ({ row }) => formatDate(row.original.submitted_at) },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => router.push(`/complaints/${row.original.id}`)}>
            <Eye className="h-4 w-4 mr-2" /> View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={MessageSquareWarning}
        title={t("complaints", { defaultMessage: "Complaints" })}
        description={t("complaints_desc", { defaultMessage: "Tenant requests and their work-order lifecycle." })}
        actions={
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/complaints/create")}>
            <Plus className="h-4 w-4 mr-2" /> {t("new_complaint", { defaultMessage: "New complaint" })}
          </Button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t("submitted", { defaultMessage: "Submitted" })} value={stats.submitted} theme="cyan" />
        <StatCard title={t("assigned", { defaultMessage: "Assigned" })} value={stats.assigned} theme="purple" />
        <StatCard title={t("in_progress", { defaultMessage: "In progress" })} value={stats.in_progress} theme="blue" />
        <StatCard title={t("closed", { defaultMessage: "Closed" })} value={stats.closed} theme="green" />
      </div>
      <TableToolbar
        config={{
          search: { placeholder: t("search_complaints", { defaultMessage: "Search complaints..." }), value: search, onChange: setSearch },
          filters: [{
            key: "status",
            placeholder: "Status",
            value: status,
            onChange: (value) => setStatus(value === "all" ? "" : value),
            options: ["submitted", "assigned", "in_progress", "on_hold", "completed", "verified", "closed"].map((value) => ({ value, label: value.replaceAll("_", " ") })),
          }],
        }}
      />
      <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} />
    </>
  );
}
