"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/helper/Loader";
import { useRouter } from "next/navigation";
import { getDriversColumns } from "./drivers-columns";
import TableToolbar from "@/components/common/table-toolbar";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { driversAPI } from "@/services/drivers/drivers-api";

export default function DriversTable({ onStatsChange }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const response = await driversAPI.getAll(params);
      setData(response.data);
      setPageCount(response.meta?.last_page || 1);
      
      if (response.stats && onStatsChange) {
        onStatsChange(response.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination, searchTerm, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await driversAPI.updateStatus(id, newStatus);
      toast.success("Driver status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleVerificationChange = async (id, verified) => {
    try {
      await driversAPI.updateVerification(id, verified);
      toast.success("Driver verification updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update verification");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      try {
        await driversAPI.delete(id);
        toast.success("Driver deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete driver");
      }
    }
  };

  const columns = getDriversColumns({
    onStatusChange: handleStatusChange,
    onVerificationChange: handleVerificationChange,
    onDelete: handleDelete,
    t
  });

  const filterOptions = [
    { label: t("All_Drivers", { defaultMessage: "All Drivers" }), value: "all" },
    { label: t("Active", { defaultMessage: "Active" }), value: "active" },
    { label: t("Inactive", { defaultMessage: "Inactive" }), value: "inactive" },
  ];

  return (
    <div className="space-y-4">
      <TableToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        setFilterValue={setStatusFilter}
        filterPlaceholder="Filter by status"
        actionButton={
          <Button onClick={() => router.push("/drivers/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pagination={pagination}
          setPagination={setPagination}
        />
      )}
    </div>
  );
}
