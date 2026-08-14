"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import TableToolbar from "@/components/common/table-toolbar";
import useDebounce from "@/hooks/useDebounceRef";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { columns } from "./banks-columns";
import BanksTable from "./banks-table";
import BanksFormModal from "./banks-form-modal";
import { DeleteDialogBox } from "@/components/common/delete-dialog-box";

export default function BanksOverview() {
  const t = useTranslations("admin");
  

  const [dataList, setDataList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/banks", {
        params: { page, per_page: pageSize, name: debouncedSearch },
      });
      const responseData = res.data?.data;
      
      if (Array.isArray(responseData)) {
        setDataList(responseData);
        setTotal(responseData.length);
      } else {
        setDataList(responseData?.data ?? []);
        setTotal(responseData?.total ?? 0);
      }
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
        is_active: isActive,
      };

      if (editingItem?.id) {
        await axiosInstance.patch(`/settings/banks/${editingItem.id}`, payload);
        toast.success("Bank updated successfully");
      } else {
        await axiosInstance.post("/settings/banks", payload);
        toast.success("Bank created successfully");
      }
      setDialogOpen(false);
      setEditingItem(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save bank");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    if (!item?.id) return;
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?.id) return;
    setDeletingId(itemToDelete.id);
    try {
      await axiosInstance.delete(`/settings/banks/${itemToDelete.id}`);
      toast.success("Bank deleted successfully");
      await fetchData();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete bank");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAutoTranslate = async (text, fromLang, toLang, targetValue, setter) => {
    if (!text || targetValue) return;
    try {
      const res = await axiosInstance.post("/translate", { text: text.trim(), from: fromLang, to: toLang });
      if (res.data?.success && res.data?.translated_text) {
        setter(res.data.translated_text);
        toast.success(`Translated to ${toLang === 'ar' ? 'Arabic' : 'English'}`);
      }
    } catch (error) {
      toast.error("Failed to translate text automatically");
    }
  };

  const tableColumns = useMemo(
    () => columns({ onEdit: openEditDialog, onDelete: handleDelete, t }),
    [t]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 my-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold">{t("Banks", { defaultMessage: "Banks" })}</h1>
          <p className="text-muted-foreground">{t("Manage_banks", { defaultMessage: "Manage banks." })}</p>
        </div>
        <div>
          <Button variant="secondary" onClick={openNewDialog} className="w-full md:w-auto mx-2">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>
      
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
        <TableToolbar
          placeholder={t("Search_banks", { defaultMessage: "Search banks..." })}
          total={total}
          onSearchChange={(val) => { setPage(1); setSearch(val); }}
          rightSlot={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-medium">{`${total} ${t("items_found", { defaultMessage: "items found" })}`}</span>
            </div>
          }
        />

        <BanksTable
          dataList={dataList}
          columns={tableColumns}
          page={page}
          pageSize={pageSize}
          total={total}
          setPage={setPage}
          setPageSize={setPageSize}
          loading={loading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
        />

        <BanksFormModal
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          editingItem={editingItem}
          name={name}
          setName={setName}
          nameAr={nameAr}
          setNameAr={setNameAr}
          isActive={isActive}
          setIsActive={setIsActive}
          saving={saving}
          handleSave={handleSave}
          handleAutoTranslate={handleAutoTranslate}
        />

        <DeleteDialogBox
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          isLoading={deletingId !== null}
          description="This action cannot be undone. This will permanently delete the bank."
        />
      </div>
    </div>
  );
}
