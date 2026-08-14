const fs = require('fs');
const path = require('path');

const configs = [
  {
    endpoint: "account-types",
    title: "Account Types",
    name: "AccountTypesSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "description_ar", label: "Description (Arabic)", type: "textarea" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "activity-types",
    title: "Activity Types",
    name: "ActivityTypesSettingsPage",
    fields: [
      { key: "account_type_id", label: "Account Type ID", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "type", label: "Type", type: "text" }
    ]
  },
  {
    endpoint: "banks",
    title: "Banks",
    name: "BanksSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "states",
    title: "States",
    name: "StatesSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" }
    ]
  },
  {
    endpoint: "industry-types",
    title: "Industry Types",
    name: "IndustryTypesSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "cities",
    title: "Cities",
    name: "CitiesSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" }
    ]
  },
  {
    endpoint: "banners",
    title: "Banners",
    name: "BannersSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "description_ar", label: "Description (Arabic)", type: "textarea" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "categories",
    title: "Categories",
    name: "CategoriesSettingsPage",
    fields: [
      { key: "parent_id", label: "Parent Category ID", type: "text" },
      { key: "type", label: "Type", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "name_ar", label: "Name (Arabic)", type: "text" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "bad-words",
    title: "Bad Words",
    name: "BadWordsSettingsPage",
    fields: [
      { key: "word", label: "Word", type: "text" },
      { key: "is_active", label: "Is Active", type: "checkbox" }
    ]
  },
  {
    endpoint: "countries",
    title: "Countries",
    name: "CountriesSettingsPage",
    fields: [
      { key: "name", label: "Name", type: "text" }
    ]
  }
];

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

for (const config of configs) {
  const dirPath = path.join(__dirname, 'src', 'app', '(protected)', 'settings', config.endpoint);
  fs.mkdirSync(dirPath, { recursive: true });

  let stateDeclarations = "";
  let resetStates = "";
  let setEditStates = "";
  let payloadObject = "";
  let columnsCode = "";
  let dialogInputs = "";

  for (const f of config.fields) {
    const camelKey = toCamelCase(f.key);
    const setFunc = `set${camelKey.charAt(0).toUpperCase() + camelKey.slice(1)}`;
    const defaultValue = f.type === 'checkbox' ? 'true' : '""';

    stateDeclarations += `  const [${camelKey}, ${setFunc}] = useState(${defaultValue});\n`;
    resetStates += `    ${setFunc}(${defaultValue});\n`;
    setEditStates += `    ${setFunc}(item.${f.key} !== undefined ? item.${f.key} : ${defaultValue});\n`;
    
    if (f.type === 'checkbox') {
        payloadObject += `          ${f.key}: ${camelKey} ? 1 : 0,\n`;
    } else {
        payloadObject += `          ${f.key}: ${camelKey} || null,\n`;
    }

    let cellCode = `        <div className="text-sm font-medium">\n          {row.original.${f.key}}\n        </div>`;
    if (f.type === 'checkbox') {
        cellCode = `        <div className="text-sm font-medium">\n          {row.original.${f.key} ? "Yes" : "No"}\n        </div>`;
    } else if (f.type === 'textarea') {
        cellCode = `        <div className="text-sm text-muted-foreground line-clamp-2 max-w-[320px]">\n          {row.original.${f.key}}\n        </div>`;
    }
    
    columnsCode += `
    {
      accessorKey: "${f.key}",
      header: "${f.label}",
      cell: ({ row }) => (
${cellCode}
      ),
    },`;

    let inputHtml = "";
    if (f.type === 'checkbox') {
      inputHtml = `                <div className="flex items-center space-x-2">\n                  <Checkbox id="${camelKey}" checked={!!${camelKey}} onCheckedChange={(checked) => ${setFunc}(checked)} />\n                  <label htmlFor="${camelKey}" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${f.label}</label>\n                </div>`;
    } else if (f.type === 'textarea') {
      inputHtml = `                <div className="space-y-1">\n                  <label className="text-sm font-medium">${f.label}</label>\n                  <Textarea value={${camelKey}} onChange={(e) => ${setFunc}(e.target.value)} placeholder="Enter ${f.label.toLowerCase()}" rows={3} />\n                </div>`;
    } else {
      inputHtml = `                <div className="space-y-1">\n                  <label className="text-sm font-medium">${f.label}</label>\n                  <Input value={${camelKey}} onChange={(e) => ${setFunc}(e.target.value)} placeholder="Enter ${f.label.toLowerCase()}" />\n                </div>`;
    }
    dialogInputs += `              ${inputHtml}\n`;
  }

  const template = `"use client";

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

export default function ${config.name}() {
  const [dataList, setDataList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
${stateDeclarations}
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
    },${columnsCode}
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
    { name: "${config.title}", url: "/settings/${config.endpoint}" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/settings/${config.endpoint}", {
        params: { page, pageSize },
      });
      const data = res.data?.data;
      setDataList(data?.${config.endpoint.replace('-', '_')} ?? data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (error) {
      toast.error("Failed to load ${config.title}");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const openNewDialog = () => {
    setEditingItem(null);
${resetStates}
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
${setEditStates}
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
${payloadObject}
      };

      if (editingItem?.id) {
        await axiosInstance.patch(\`/settings/${config.endpoint}/\${editingItem.id}\`, payload);
        toast.success("${config.title} item updated successfully");
      } else {
        await axiosInstance.post("/settings/${config.endpoint}", payload);
        toast.success("${config.title} item created successfully");
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
      await axiosInstance.delete(\`/settings/${config.endpoint}/\${item.id}\`);
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">${config.title}</h1>
            <p className="text-muted-foreground">
              Manage ${config.title.toLowerCase()}.
            </p>
          </div>
          <Button onClick={openNewDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">${config.title} List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="h-6 w-6 text-primary" />
              </div>
            ) : dataList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No items found. Add your first item to get started.
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit ${config.title} Item" : "Add ${config.title} Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
${dialogInputs}
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
`;

  fs.writeFileSync(path.join(dirPath, 'page.jsx'), template);
  console.log('Generated ' + config.endpoint);
}
