"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/pmms/page-header";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

function emptyLine() {
  return { part_id: "", quantity: "1", remarks: "" };
}

export default function PurchaseRequestForm({ purchaseRequest }) {
  const t = useT("common");
  const router = useRouter();
  const [parts, setParts] = useState([]);
  const [low, setLow] = useState([]);
  const [remarks, setRemarks] = useState(purchaseRequest?.remarks || "");
  const [items, setItems] = useState(
    purchaseRequest?.items?.length
      ? purchaseRequest.items.map((item) => ({ part_id: item.part_id || "", quantity: String(item.quantity), remarks: item.remarks || "" }))
      : [emptyLine()]
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inventoryApi.parts().then((data) => setParts(Array.isArray(data) ? data : [])).catch(() => {});
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
      items: items.filter((item) => item.part_id && Number(item.quantity) > 0).map((item) => ({
        part_id: item.part_id,
        quantity: Number(item.quantity),
        remarks: item.remarks || undefined,
      })),
    };
    if (!payload.items.length) {
      toast.error(t("pr_items_required", { defaultMessage: "Add at least one part" }));
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
        <Textarea placeholder={t("remarks", { defaultMessage: "Remarks" })} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        <div className="flex justify-between">
          <p className="text-sm font-semibold">{t("items", { defaultMessage: "Items" })}</p>
          <Button type="button" variant="outline" size="sm" onClick={addLowStock}>{t("add_low_stock", { defaultMessage: "Add low-stock items" })}</Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-12">
              <select
                className="h-10 rounded-md border px-3 text-sm md:col-span-5"
                value={item.part_id}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, part_id: event.target.value } : row))}
              >
                <option value="">{t("part", { defaultMessage: "Part" })}</option>
                {parts.map((part) => <option key={part.id} value={part.id}>{part.name} ({part.sku})</option>)}
              </select>
              <Input
                type="number"
                min="0.001"
                step="0.001"
                className="md:col-span-2"
                value={item.quantity}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, quantity: event.target.value } : row))}
              />
              <Input
                className="md:col-span-4"
                placeholder={t("remarks", { defaultMessage: "Remarks" })}
                value={item.remarks}
                onChange={(event) => setItems((current) => current.map((row, i) => i === index ? { ...row, remarks: event.target.value } : row))}
              />
              <Button type="button" variant="ghost" className="md:col-span-1" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
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
