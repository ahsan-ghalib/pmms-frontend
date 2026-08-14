"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/common/data-table";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableToolbar from "@/components/common/table-toolbar";
import { employeesApi } from "@/services/employees/employees-api";
import { getEmployeesColumns } from "./employees-columns";
import { EmployeeFormDialog } from "./employee-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useDebounce from "@/hooks/useDebounceRef";

export function EmployeesTable() {
  const t = useTranslations("admin");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeesApi.getEmployees({
        page,
        pageSize,
        search: debouncedSearch,
      });
      setData(res.data);
      setTotal(res.meta.total);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await employeesApi.deleteEmployee(deleteDialog.id);
      toast.success("Employee deleted successfully");
      setDeleteDialog({ open: false, id: null });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = React.useMemo(
    () => getEmployeesColumns(
      (employee) => {
        setSelectedEmployeeId(employee.id);
        setIsDialogOpen(true);
      },
      (employee) => {
        setDeleteDialog({ open: true, id: employee.id });
      },
      t
    ),
    [t]
  );

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        <div>
          <h1 className="text-2xl font-bold">{t("Employees", { defaultMessage: "Employees" })}</h1>
          <p className="text-muted-foreground">
            {t("Manage_employees_desc", { defaultMessage: "Manage your branch managers and staff" })}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedEmployeeId(null);
            setIsDialogOpen(true);
          }}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("Add_Employee", { defaultMessage: "Add Employee" })}
        </Button>
      </div>

      <div className="">
        <TableToolbar
          placeholder={t("Search_employees_placeholder", { defaultMessage: "Search employees by name, email..." })}
          total={total}
          onSearchChange={(value) => {
            setPage(1); // Assuming pagination in EmployeesTable is 1-indexed based on API, wait, check fetchEmployees - yes it passes `page` directly, but let's just update search
            setSearch(value);
          }}
          rightSlot={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>{t("employees_found", { defaultMessage: "{total} employees found", total })}</span>
            </div>
          }
        />

        <DataTable
          columns={columns}
          data={data}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={total}
          isLoading={loading}
          loadingText="Loading employees..."
        />
      </div>

      <EmployeeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        employeeId={selectedEmployeeId}
        onSuccess={fetchEmployees}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
