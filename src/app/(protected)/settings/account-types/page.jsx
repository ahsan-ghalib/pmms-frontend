"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export default function AccountTypesSettingsPage() {
  const t = useTranslations("admin");
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
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState("");
  const [icon, setIcon] = useState(null);
  const [image, setImage] = useState(null);

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
      header: t("Name", { defaultMessage: "Name" }),
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "name_ar",
      header: t("Name_Arabic", { defaultMessage: "Name (Arabic)" }),
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.name_ar}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: t("Description", { defaultMessage: "Description" }),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "description_ar",
      header: t("Description_Arabic", { defaultMessage: "Description (Arabic)" }),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">
          {row.original.description_ar}
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: t("Is_Active", { defaultMessage: "Is Active" }),
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.is_active ? "Yes" : "No"}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right w-[120px]">{t("Actions", { defaultMessage: "Actions" })}</div>
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
    { name: t("Settings", { defaultMessage: "Settings" }), url: "/settings" },
    { name: t("Account_Types", { defaultMessage: "Account Types" }), url: "/settings/account-types" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/account-types", {
        params: { page, pageSize, search: debouncedSearch },
      });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data?.account_types ?? data?.data ?? []);
      setDataList(list);
      setTotal(data?.total ?? list.length);
    } catch (error) {
      toast.error("Failed to load Account Types");
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
    setDescription("");
    setDescriptionAr("");
    setIsActive(true);
    setSequence("");
    setIcon(null);
    setImage(null);

    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setName(item.name !== undefined ? item.name : "");
    setNameAr(item.name_ar !== undefined ? item.name_ar : "");
    setDescription(item.description !== undefined ? item.description : "");
    setDescriptionAr(item.description_ar !== undefined ? item.description_ar : "");
    setIsActive(item.is_active !== undefined ? item.is_active : true);
    setSequence(item.sequence !== undefined ? item.sequence : "");
    setIcon(null); // Can't easily preview previous file yet without extra logic
    setImage(null);

    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name || "");
      formData.append("name_ar", nameAr || "");
      formData.append("description", description || "");
      formData.append("description_ar", descriptionAr || "");
      formData.append("is_active", isActive ? 1 : 0);
      formData.append("sequence", sequence !== "" ? sequence : "");
      if (icon) formData.append("icon", icon);
      if (image) formData.append("image", image);
      
      if (editingItem?.id) {
        formData.append("_method", "PUT");
        await axiosInstance.post(`/settings/account-types/${editingItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Account Types item updated successfully");
      } else {
        await axiosInstance.post("/settings/account-types", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Account Types item created successfully");
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
      await axiosInstance.delete(`/settings/account-types/${item.id}`);
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
            <h1 className="text-2xl font-bold">{t("Account_Types", { defaultMessage: "Account Types" })}</h1>
            <p className="text-muted-foreground">
              {t("Manage_account_types", { defaultMessage: "Manage account types." })}
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
          placeholder={t("Search_items", { defaultMessage: "Search items..." })}
          total={total}
          onSearchChange={(val) => { setPage(1); setSearch(val); }}
          rightSlot={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-medium">{`${total} ${t("items_found", { defaultMessage: "items found" })}`}</span>
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
                loadingText={t("Loading", { defaultMessage: "Loading..." })}
                enableRowSelection={true}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnsBtn={false}
              />
          

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Account Types Item" : "Add Account Types Item"}</DialogTitle>
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
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" rows={3} />
                </div>
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Description (Arabic)</label>
                  <Textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="Enter description (arabic)" rows={3} />
                </div>
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Sequence</label>
                  <Input type="number" value={sequence} onChange={(e) => setSequence(e.target.value)} placeholder="Enter sequence (e.g., 1)" />
                </div>
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Icon (Upload)</label>
                  <Input type="file" accept="image/*" onChange={(e) => setIcon(e.target.files[0])} />
                  {editingItem?.icon && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep existing icon.</p>}
                </div>
                              <div className="space-y-1">
                  <label className="text-sm font-medium">Image (Upload)</label>
                  <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                  {editingItem?.image && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep existing image.</p>}
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
