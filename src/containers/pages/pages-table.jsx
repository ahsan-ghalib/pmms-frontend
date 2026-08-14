"use client";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";
import { toast } from "sonner";
import { Plus, FileText } from "lucide-react";
import TableToolbar from "@/components/common/table-toolbar";
import { pagesColumns } from "./pages-columns";
import { PageFormDialog } from "./page-form-dialog";
import axiosInstance from "@/lib/axios";
import useDebounce from "@/hooks/useDebounceRef";

export default function PagesTable() {
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
      const response = await axiosInstance.get("/pages", {
        params: {
          page: page + 1,
          pageSize,
          search: search.trim(),
        },
      });

      setTableData(response.data.data?.pages || []);
      setTotal(response.data.data?.total ?? 0);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to fetch pages");
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

  const handleEdit = (pageItem) => {
    setItemToEdit(pageItem);
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
        response = await axiosInstance.patch(`/pages/${id}`, data);
      } else {
        response = await axiosInstance.post("/pages", data);
      }

      setFormDialogOpen(false);
      setItemToEdit(null);
      toast.success(
        id ? "Page updated successfully" : "Page created successfully"
      );
    } catch (error) {
      console.error("Error saving page:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save page";
      toast.error(errorMessage);
      throw error;
    } finally {
      fetchTableData(page, pageSize, debouncedSearch);
    }
  };

  const handleDelete = (pageItem) => {
    setItemToDelete(pageItem);
    setDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/pages/${itemToDelete.id}`);

      setTableData((prevData) =>
        prevData.filter((item) => item.id !== itemToDelete.id)
      );
      toast.success("Page deleted successfully");
      setDeletePopupOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            Manage static pages like Privacy Policy, Terms & Conditions, etc.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleAdd}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      <TableToolbar
        placeholder="Search pages by title, content, or type..."
        total={total}
        onSearchChange={handleSearchChange}
        rightSlot={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 text-secondary" />
            <span>{total} pages found</span>
          </div>
        }
      />

      <DataTable
        columns={pagesColumns(handleEdit, handleDelete)}
        data={tableData}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        total={total}
        isLoading={isTableLoading}
        loadingText="Loading pages..."
      />

      <PageFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setItemToEdit(null);
        }}
        page={itemToEdit}
        onSave={handleSave}
      />

      <DeleteDialogBox
        open={deletePopupOpen}
        onClose={() => {
          setDeletePopupOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Page"
        description={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}

