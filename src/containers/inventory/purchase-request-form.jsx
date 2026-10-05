"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableEnumDropdown } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { workOrdersApi } from "@/services/work-orders/work-orders-api";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

function emptyLine() {
  return { part_id: "", category_id: "", asset_id: "", search: "", quantity: "1", remarks: "" };
}

export default function PurchaseRequestForm({ purchaseRequest }) {
  const t = useT("common");
  const router = useRouter();
  const [parts, setParts] = useState([]);
  const [low, setLow] = useState([]);
  const [remarks, setRemarks] = useState(purchaseRequest?.remarks || "");
  const [requestType, setRequestType] = useState(purchaseRequest?.request_type || "part");
  const [department, setDepartment] = useState(purchaseRequest?.department || "");
  const [workOrderId, setWorkOrderId] = useState(purchaseRequest?.work_order_id || "");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetCategories, setAssetCategories] = useState([]);
  const [items, setItems] = useState(
    purchaseRequest?.items?.length
      ? purchaseRequest.items.map((item) => ({ part_id: item.part_id || "", category_id: item.category_id || "", asset_id: item.asset_id || "", quantity: String(item.quantity), remarks: item.remarks || "" }))
      : [emptyLine()]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inventoryApi.parts().then((data) => setParts(Array.isArray(data) ? data : [])).catch(() => {});
    inventoryApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    workOrdersApi.list().then((data) => setWorkOrders(Array.isArray(data) ? data : [])).catch(() => {});
    assetsApi.list().then((data) => setAssets(Array.isArray(data) ? data : [])).catch(() => {});
    assetsApi.categories().then((data) => setAssetCategories(Array.isArray(data) ? data : [])).catch(() => {});
    inventoryApi.lowStock().then((data) => setLow(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const addLowStock = () => {
    if (!low.length) {
      toast.error(t("no_low_stock", { defaultMessage: "No low-stock parts right now" }));
      return;
    }
    setItems(low.map((row) => ({
      part_id: row.id,
      quantity: String(Math.max(1, Number(row.minimum_stock) - Number(row.on_hand))),
      remarks: "From low stock",
    })));
  };

  const save = async () => {
    const payload = {
      remarks: remarks || undefined,
      request_type: requestType,
      department: department || undefined,
      work_order_id: workOrderId || undefined,
      items: items.filter((item) => (requestType === "asset" ? item.asset_id : requestType === "other" ? true : item.part_id) && Number(item.quantity) > 0).map((item) => ({
        part_id: requestType === "part" ? item.part_id : undefined,
        asset_id: requestType === "asset" ? item.asset_id : undefined,
        category_id: item.category_id || parts.find((part) => part.id === item.part_id)?.category_id || undefined,
        quantity: Number(item.quantity),
        remarks: item.remarks || undefined,
      })),
    };
    if (!payload.items.length) {
      toast.error(t("pr_items_required", { defaultMessage: "Add at least one request item" }));
      return;
    }
    setSaving(true);
    try {
      const saved = purchaseRequest
        ? await inventoryApi.updatePurchaseRequest(purchaseRequest.id, payload)
        : await inventoryApi.createPurchaseRequest(payload);
      toast.success(purchaseRequest ? t("pr_updated", { defaultMessage: "Purchase request updated" }) : t("pr_created", { defaultMessage: "Purchase request created" }));
      router.push(`/inventory/purchase-requests/${saved.id}`);
    } catch (error) {
      toast.error(apiError(error, t("pr_save_failed", { defaultMessage: "Unable to save purchase request" })));
    } finally {
      setSaving(false);
    }
  };
  const visibleParts = (query = "") => parts.filter((part) => (!categoryId || part.category_id === categoryId) && (!query || `${part.name} ${part.sku}`.toLowerCase().includes(query.toLowerCase())));
  const visibleAssets = (query = "") => assets.filter((asset) => (!categoryId || asset.category_id === categoryId) && (!query || `${asset.name_en || asset.name || ""} ${asset.code || asset.asset_code || ""}`.toLowerCase().includes(query.toLowerCase())));
  const categoryOptions = (requestType === "asset" ? assetCategories : categories).map((category) => ({ value: category.id, label: category.name_en || category.name, searchText: `${category.name_en || category.name}`.toLowerCase() }));

  const createFromLow = async () => {
    setSaving(true);
    try {
      const saved = await inventoryApi.createPurchaseRequest({ from_low_stock: true });
      toast.success(t("pr_created", { defaultMessage: "Purchase request created" }));
      router.push(`/inventory/purchase-requests/${saved.id}`);
    } catch (error) {
      toast.error(apiError(error, t("pr_save_failed", { defaultMessage: "Unable to save purchase request" })));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShoppingCart}
        title={purchaseRequest ? t("edit_pr", { defaultMessage: "Edit purchase request" }) : t("new_pr", { defaultMessage: "New purchase request" })}
        description={t("pr_form_desc", { defaultMessage: "Add parts from low stock or pick them manually. A saved PR starts in Draft." })}
        actions={!purchaseRequest && (
          <Button variant="outline" onClick={createFromLow} disabled={saving}>
            {t("from_low_stock", { defaultMessage: "Create from low stock" })}
          </Button>
        )}
      />

      <section className="glass-panel space-y-4 rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">Request Type<select className="mt-1 h-10 w-full rounded-md border px-3" value={requestType} onChange={(e) => setRequestType(e.target.value)}><option value="part">Part</option><option value="asset">Asset</option><option value="other">Other</option></select></label>
          <label className="text-sm font-medium">Department<select className="mt-1 h-10 w-full rounded-md border px-3" value={department} onChange={(e) => setDepartment(e.target.value)}><option value="">Select department</option>{["Maintenance", "Operations", "Facilities", "Procurement", "IT", "Finance", "Other"].map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="text-sm font-medium">Work Order (optional)<select className="mt-1 h-10 w-full rounded-md border px-3" value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)}><option value="">No work order</option>{workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.number || wo.wo_number || wo.code || wo.id}</option>)}</select></label>
        </div>
        <Textarea placeholder={t("remarks", { defaultMessage: "Remarks" })} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        <div className="flex justify-between">
          <p className="text-sm font-semibold">{t("items", { defaultMessage: "Items" })}</p>
          <Button type="button" variant="outline" size="sm" onClick={addLowStock}>{t("add_low_stock", { defaultMessage: "Add low-stock items" })}</Button>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div><p className="text-sm font-semibold">Select {requestType === "asset" ? "asset" : "part"} items</p><p className="text-xs text-slate-500">Search inside each selector by name or code.</p></div>
          <SearchableEnumDropdown name="pr-category" label="Category" placeholder="All categories" searchPlaceholder="Search categories..." value={categoryId} onChange={setCategoryId} options={categoryOptions} className="mb-0" />
          {items.map((item, index) => (
            <div key={index} className="grid items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-12 dark:border-white/10 dark:bg-slate-950/30">
              {requestType === "asset" ? <div className="md:col-span-5"><SearchableEnumDropdown name={`asset-${index}`} placeholder="Select asset" searchPlaceholder="Search assets..." value={item.asset_id} onChange={(value) => setItems((current) => current.map((row, i) => i === index ? { ...row, asset_id: value } : row))} options={visibleAssets().map((asset) => ({ value: asset.id, label: `${asset.name_en || asset.name} (${asset.code || asset.asset_code || "—"})`, searchText: `${asset.name_en || asset.name || ""} ${asset.code || asset.asset_code || ""}`.toLowerCase() }))} className="mb-0" /><select
                className="hidden"
                value={item.asset_id}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, asset_id: event.target.value } : row))}
              >
                <option value="">Asset</option>
                {visibleAssets(item.search).map((asset) => <option key={asset.id} value={asset.id}>{asset.name_en || asset.name} ({asset.code || asset.asset_code || "—"})</option>)}
              </select></div> : <div className="md:col-span-5"><SearchableEnumDropdown name={`part-${index}`} placeholder="Select part" searchPlaceholder="Search parts by name or SKU..." value={item.part_id} onChange={(value) => setItems((current) => current.map((row, i) => i === index ? { ...row, part_id: value } : row))} options={visibleParts().map((part) => ({ value: part.id, label: `${part.name} (${part.sku}) · ${part.unit_of_measure}`, searchText: `${part.name} ${part.sku}`.toLowerCase() }))} className="mb-0" /><select
                className="hidden"
                value={item.part_id}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, part_id: event.target.value } : row))}
              >
                <option value="">{t("part", { defaultMessage: "Part" })}</option>
                {visibleParts(item.search).map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku}) · {part.unit_of_measure}</option>)}
              </select></div>}
              <label className="text-xs font-semibold text-slate-500 md:col-span-2">Quantity<Input
                type="number"
                min="0.001"
                step="0.001"
                className="md:col-span-2"
                value={item.quantity}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, quantity: event.target.value } : row))}
              /></label>
              <label className="text-xs font-semibold text-slate-500 md:col-span-4">Remarks<Input
                className="mt-1"
                placeholder="Optional remarks"
                value={item.remarks}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, remarks: event.target.value } : row))}
              /></label>
              <Button type="button" variant="ghost" className="md:col-span-1" aria-label="Remove item" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, emptyLine()])}>
          <Plus className="mr-2 h-4 w-4" /> {t("add_line", { defaultMessage: "Add line" })}
        </Button>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(purchaseRequest?.id ? `/inventory/purchase-requests/${purchaseRequest.id}` : "/inventory/purchase-requests")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving} onClick={save}>
          {t("save_draft", { defaultMessage: "Save draft" })}
        </Button>
      </div>
    </div>
  );
}
