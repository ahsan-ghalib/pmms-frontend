"use client";
import { useEffect, useRef, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";
import TableToolbar from "@/components/common/table-toolbar";
import { areasColumns } from "./areas-columns";
import { dummyAreas } from "./areas-dummy-data";
import { AreaFormDialog } from "./area-form-dialog";
import axiosInstance from "@/lib/axios";
import useDebounce from "@/hooks/useDebounceRef";
import { hasPermissionSync, Permissions } from "@/lib/permissions";

export default function AreasTable() {
  const [tableData, setTableData] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const debouncedSearch = useDebounce(search, 1000);

  const fetchTableData = async (page, pageSize, search = "") => {
    setIsTableLoading(true);
    try {
      const response = await axiosInstance.get("/locations/areas", {
        params: {
          page: page + 1,
          pageSize,
          search: search.trim(),
        },
      });

      setTableData(response.data.data?.areas || []);
      setTotal(response.data.data?.total ?? 0);
    } catch (error) {
      toast.error("Failed to fetch areas");
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(page, pageSize, debouncedSearch);
  }, [page, pageSize, debouncedSearch]);

  const handleSearchChange = (value) => {
    setPage(0);
    setSearch(value);
  };

  const handleEdit = (area) => {
    setItemToEdit(area);
    setFormDialogOpen(true);
  };

  const handleAdd = () => {
    setItemToEdit(null);
    setFormDialogOpen(true);
  };

  const handleSave = async (data, id) => {
    try {
      let response;
      if (id) {
        response = await axiosInstance.patch(`/locations/areas/${id}`, data);
      } else {
        response = await axiosInstance.post("/locations/areas", data);
      }

      setFormDialogOpen(false);
      setItemToEdit(null);
    } catch (error) {
      throw error;
    } finally {
      fetchTableData(page, pageSize, debouncedSearch);
    }
  };

  const handleDelete = (area) => {
    setItemToDelete(area);
    setDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/locations/areas/${itemToDelete.id}`);

      setTableData((prevData) =>
        prevData.filter((item) => item.id !== itemToDelete.id)
      );
      toast.success("Area deleted successfully");
      setDeletePopupOpen(false);
    } catch (error) {
      toast.error("Failed to delete area");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        <div>
          <h1 className="text-2xl font-bold">Areas</h1>
          <p className="text-muted-foreground">Manage areas and zones</p>
        </div>
        {hasPermissionSync(Permissions.ADD_AREAS) && (
          <Button
            variant="secondary"
            onClick={handleAdd}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Area
          </Button>
        )}
      </div>

      <TableToolbar
        placeholder="Search areas by name, city, state, or country..."
        total={total}
        onSearchChange={handleSearchChange}
        rightSlot={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-secondary" />
            <span>{total} areas found</span>
          </div>
        }
      />

      <DataTable
        columns={areasColumns(handleEdit, handleDelete)}
        data={tableData}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={total}
        isLoading={isTableLoading}
        loadingText="Loading areas..."
      />

      <AreaFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setItemToEdit(null);
        }}
        area={itemToEdit}
        onSave={handleSave}
      />

      <DeleteDialogBox
        open={deletePopupOpen}
        onClose={() => setDeletePopupOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Area"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
