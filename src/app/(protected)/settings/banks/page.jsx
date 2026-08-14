"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import TableToolbar from "@/components/common/table-toolbar";
import useDebounce from "@/hooks/useDebounceRef";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { LoadingSpinner } from "@/helper/Loader";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/common/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit } from "lucide-react";

export default function BanksSettingsPage() {
  const [dataList, setDataList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 1000);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "name_ar",
      header: "Name (Arabic)",
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.name_ar}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Is Active",
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.is_active ? "Yes" : "No"}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right w-[120px]">Actions</div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end gap-2 w-[120px]">
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEditDialog(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(item)}
              disabled={deletingId === item.id}
            >
              {deletingId === item.id ? (
                <LoadingSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const breadcrumbData = [
    { name: "Settings", url: "/settings" },
    { name: "Banks", url: "/settings/banks" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/banks", {
        params: { page, pageSize, search: debouncedSearch },
      });
      const data = res.data?.data;
      setDataList(data?.banks ?? data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (error) {
      toast.error("Failed to load Banks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, debouncedSearch]);

  const openNewDialog = () => {
    setEditingItem(null);
    setName("");
    setNameAr("");
    setIsActive(true);

    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setName(item.name !== undefined ? item.name : "");
    setNameAr(item.name_ar !== undefined ? item.name_ar : "");
    setIsActive(item.is_active !== undefined ? item.is_active : true);

    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
          name: name || null,
          name_ar: nameAr || null,
          is_active: isActive ? 1 : 0,

      };

      if (editingItem?.id) {
        await axiosInstance.patch(`/settings/banks/${editingItem.id}`, payload);
        toast.success("Banks item updated successfully");
      } else {
        await axiosInstance.post("/settings/banks", payload);
        toast.success("Banks item created successfully");
      }
      setDialogOpen(false);
      setEditingItem(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setDeletingId(item.id);
    try {
      await axiosInstance.delete(`/settings/banks/${item.id}`);
      toast.success("Item deleted successfully");
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4">
          <div>
            <h1 className="text-2xl font-bold">Banks</h1>
            <p className="text-muted-foreground">
              Manage banks.
            </p>
          </div>
          <div>
            <Button variant="secondary" onClick={openNewDialog} className="w-full md:w-auto mx-2">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
        
        <TableToolbar
          placeholder="Search items..."
          total={total}
          onSearchChange={(val) => { setPage(1); setSearch(val); }}
          rightSlot={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-medium">{total} items found</span>
            </div>
          }
        />

        
            <DataTable
                data={dataList}
                columns={columns}
                page={page - 1}
                pageSize={pageSize}
                total={total}
                setPage={(p) => setPage(p + 1)}
                setPageSize={() => {}}
                pagination={true}
                isLoading={loading}
                loadingText="Loading..."
                enableRowSelection={true}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnsBtn={false}
              />
          

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Banks Item" : "Add Banks Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
                </div>
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Name (Arabic)</label>
                  <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Enter name (arabic)" />
                </div>
                              <div className="flex items-center space-x-2">
                  <Checkbox id="isActive" checked={!!isActive} onCheckedChange={(checked) => setIsActive(checked)} />
                  <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Is Active</label>
                </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
