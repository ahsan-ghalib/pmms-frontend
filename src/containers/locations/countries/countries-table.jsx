"use client";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";
import { toast } from "sonner";
import { Plus, Globe } from "lucide-react";
import TableToolbar from "@/components/common/table-toolbar";
import { countriesColumns } from "./countries-columns";
import { CountryFormDialog } from "./country-form-dialog";
import axiosInstance from "@/lib/axios";
import useDebounce from "@/hooks/useDebounceRef";
import { hasPermissionSync, Permissions } from "@/lib/permissions";

export default function CountriesTable() {
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
      const response = await axiosInstance.get("/locations/countries", {
        params: {
          page: page + 1,
          pageSize,
          search: search.trim(),
        },
      });

      setTableData(response.data.data?.countries || []);
      setTotal(response.data.data?.total ?? 0);
    } catch (error) {
      toast.error("Failed to fetch countries");
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
  const handleEdit = (country) => {
    setItemToEdit(country);
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
        response = await axiosInstance.patch(
          `/locations/countries/${id}`,
          data
        );
      } else {
        response = await axiosInstance.post("/locations/countries", data);
      }

      setFormDialogOpen(false);
      setItemToEdit(null);
    } catch (error) {
      throw error;
    } finally {
      fetchTableData(page, pageSize, debouncedSearch);
    }
  };

  const handleDelete = (country) => {
    setItemToDelete(country);
    setDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/locations/countries/${itemToDelete.id}`);

      setTableData((prevData) =>
        prevData.filter((item) => item.id !== itemToDelete.id)
      );
      toast.success("Country deleted successfully");
      setDeletePopupOpen(false);
    } catch (error) {
      toast.error("Failed to delete country");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        <div>
          <h1 className="text-2xl font-bold">Countries</h1>
          <p className="text-muted-foreground">Manage available countries</p>
        </div>
        {hasPermissionSync(Permissions.ADD_COUNTRIES) && (
          <Button
            variant="secondary"
            onClick={handleAdd}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Country
          </Button>
        )}
      </div>

      <TableToolbar
        placeholder="Search countries by name, code, or phone code..."
        total={total}
        onSearchChange={handleSearchChange}
        rightSlot={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 text-secondary" />
            <span>{total} countries found</span>
          </div>
        }
      />

      <DataTable
        columns={countriesColumns(handleEdit, handleDelete)}
        data={tableData}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={total}
        isLoading={isTableLoading}
        loadingText="Loading countries..."
      />

      <CountryFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setItemToEdit(null);
        }}
        country={itemToEdit}
        onSave={handleSave}
      />

      <DeleteDialogBox
        open={deletePopupOpen}
        onClose={() => setDeletePopupOpen(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Country"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
