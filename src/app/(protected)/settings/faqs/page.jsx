"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function FaqsSettingsPage() {
  const [faqs, setFaqs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground min-w-[140px]">
          {row.original.type || "—"}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Question",
      cell: ({ row }) => (
        <div className="font-medium min-w-[220px] max-w-[320px]">
          {row.original.title}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Answer",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground line-clamp-3 max-w-[480px]">
          {row.original.description}
        </p>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="text-right w-[120px]">Actions</div>
      ),
      cell: ({ row }) => {
        const faq = row.original;
        return (
          <div className="flex justify-end gap-2 w-[120px]">
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEditDialog(faq)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(faq)}
              disabled={deletingId === faq.id}
            >
              {deletingId === faq.id ? (
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
    { name: "FAQs", url: "/settings/faqs" },
  ];

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/faqs", {
        params: { page, pageSize },
      });
      const data = res.data?.data;
      setFaqs(data?.faqs ?? []);
      setTotal(data?.total ?? 0);
    } catch (error) {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [page, pageSize]);

  const openNewDialog = () => {
    setEditingFaq(null);
    setType("");
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEditDialog = (faq) => {
    setEditingFaq(faq);
    setType(faq.type || "");
    setTitle(faq.title || "");
    setDescription(faq.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      if (editingFaq?.id) {
        await axiosInstance.patch(`/settings/faqs/${editingFaq.id}`, {
          type: type.trim() || null,
          title: title.trim(),
          description: description.trim(),
        });
        toast.success("FAQ updated successfully");
      } else {
        await axiosInstance.post("/settings/faqs", {
          type: type.trim() || null,
          title: title.trim(),
          description: description.trim(),
        });
        toast.success("FAQ created successfully");
      }
      setDialogOpen(false);
      setEditingFaq(null);
      await fetchFaqs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq) => {
    if (!faq?.id) return;
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    setDeletingId(faq.id);
    try {
      await axiosInstance.delete(`/settings/faqs/${faq.id}`);
      toast.success("FAQ deleted successfully");
      await fetchFaqs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete FAQ");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">FAQs</h1>
            <p className="text-muted-foreground">
              Manage frequently asked questions shown on the customer FAQs page.
            </p>
          </div>
          <Button onClick={openNewDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add FAQ
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">FAQ List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="h-6 w-6 text-primary" />
              </div>
            ) : faqs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No FAQs found. Add your first question to get started.
              </p>
            ) : (
              <DataTable
                data={faqs}
                columns={columns}
                page={page - 1}
                pageSize={pageSize}
                total={total}
                setPage={(p) => setPage(p + 1)}
                setPageSize={() => {}}
                pagination={true}
                isLoading={loading}
                loadingText="Loading FAQs..."
                enableRowSelection={true}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnsBtn={false}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <Input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. Delivery, Orders & Payments"
                />
                <p className="text-xs text-muted-foreground">
                  Used for grouping FAQs on the web app.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Question</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the question"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Answer</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter the answer"
                  rows={5}
                />
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

