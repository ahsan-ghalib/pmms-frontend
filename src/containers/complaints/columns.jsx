"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const getPriorityBadge = (priority, t) => {
  switch (priority) {
    case 'high': return <Badge variant="destructive">{t('high') || 'High'}</Badge>;
    case 'medium': return <Badge className="bg-amber-500 hover:bg-amber-600">{t('medium') || 'Medium'}</Badge>;
    case 'low': return <Badge variant="outline" className="text-cyan-700 border-cyan-200 bg-cyan-50">{t('low') || 'Low'}</Badge>;
    default: return <Badge variant="outline">{priority}</Badge>;
  }
};

export const getStatusBadge = (status, t) => {
  switch (status) {
    case 'pending': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">{t('pending') || 'Pending'}</Badge>;
    case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">{t('in_progress') || 'In Progress'}</Badge>;
    case 'resolved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">{t('resolved') || 'Resolved'}</Badge>;
    case 'rejected': return <Badge variant="destructive">{t('rejected') || 'Rejected'}</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export const getComplaintsColumns = (t, router) => [
  {
    accessorKey: "id",
    header: t("complaint_id") || "Complaint ID",
    cell: ({ row }) => <div className="font-bold text-teal-600">#{row.original.id}</div>,
  },
  {
    accessorKey: "user.name",
    header: t("sender") || "Sender",
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-medium">{row.original.user?.name || "N/A"}</div>
        <div className="text-muted-foreground text-xs">{row.original.user?.email}</div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: t("type") || "Type",
    cell: ({ row }) => <div className="text-sm font-medium">{t(row.original.type) || row.original.type}</div>,
  },
  {
    accessorKey: "subject",
    header: t("subject") || "Subject",
    cell: ({ row }) => <div className="text-sm font-medium">{row.original.subject}</div>,
  },
  {
    accessorKey: "priority",
    header: t("priority") || "Priority",
    cell: ({ row }) => getPriorityBadge(row.original.priority, t),
  },
  {
    accessorKey: "status",
    header: t("status") || "Status",
    cell: ({ row }) => getStatusBadge(row.original.status, t),
  },
  {
    accessorKey: "created_at",
    header: t("created_at") || "Created At",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-muted-foreground">
        {new Date(row.original.created_at).toLocaleString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">{t("actions") || "Actions"}</div>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/complaints/${row.original.id}`)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t("view") || "View"}
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
