"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextareaField, TimeField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { workOrdersApi } from "@/services/work-orders/work-orders-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const withSeconds = (time) => (time ? (time.length === 5 ? `${time}:00` : time) : undefined);

export default function WorkOrderForm() {
  const today = new Date().toISOString().slice(0, 10);
  const t = useT("common");
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const { control, register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      property_id: "",
      asset_id: "",
      category_id: "",
      service_id: "",
      type: "normal",
      priority: "normal",
      description: "",
      scheduled_date: "",
      scheduled_start_time: "",
      scheduled_end_time: "",
    },
  });

  const categoryId = watch("category_id");
  const propertyId = watch("property_id");
  const services = categories.find((category) => category.id === categoryId)?.services || [];
  const assignableAssets = assets.filter((asset) => asset.status !== "disposed");

  useEffect(() => {
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setAssets([]);
      return;
    }
    assetsApi.list({ property_id: propertyId }).then((data) => setAssets(Array.isArray(data) ? data : [])).catch(() => setAssets([]));
  }, [propertyId]);

  const onSubmit = async (values) => {
    try {
      const created = await workOrdersApi.create({
        ...values,
        asset_id: values.asset_id || undefined,
        scheduled_date: values.scheduled_date || undefined,
        scheduled_start_time: withSeconds(values.scheduled_start_time),
        scheduled_end_time: withSeconds(values.scheduled_end_time),
      });
      toast.success("Work order created");
      router.push(`/work-orders/${created.data?.id || ""}`);
    } catch (error) {
      toast.error(apiError(error, "Unable to create work order"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader icon={ClipboardList} title={t("manual_work_order", { defaultMessage: "Manual work order" })} description={t("manual_work_order_desc", { defaultMessage: "Create a job for a vacant unit or common area." })} />
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border rounded-2xl p-6 grid md:grid-cols-2 gap-4">
        <SelectField label="Property" name="property_id" control={control} errors={errors} validation={{ required: "Required" }} options={properties.map((item) => ({ value: item.id, label: item.name }))} />
        <SelectField label="Asset" name="asset_id" control={control} errors={errors} options={assignableAssets.map((item) => ({ value: item.id, label: `${item.asset_code} · ${item.name}` }))} />
        <SelectField label="Type" name="type" control={control} errors={errors} options={[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }, { value: "preventive", label: "Preventive" }]} />
        <SelectField label="Category" name="category_id" control={control} errors={errors} validation={{ required: "Required" }} options={categories.map((item) => ({ value: item.id, label: item.name_en }))} />
        <SelectField label="Service" name="service_id" control={control} errors={errors} validation={{ required: "Required" }} options={services.map((item) => ({ value: item.id, label: item.name_en }))} />
        <SelectField label="Priority" name="priority" control={control} errors={errors} options={[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }]} />
        <DateField label="Scheduled date" name="scheduled_date" register={register} errors={errors} min={today} />
        <div className="grid grid-cols-2 gap-4">
          <TimeField label="Start time" name="scheduled_start_time" register={register} errors={errors} />
          <TimeField
            label="End time"
            name="scheduled_end_time"
            register={register}
            errors={errors}
            validation={{
              validate: (value, form) => !value || !form.scheduled_start_time || value > form.scheduled_start_time || "End time must be after start time",
            }}
          />
        </div>
        <div className="md:col-span-2">
          <TextareaField label="Description" name="description" control={control} errors={errors} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">Create work order</Button>
      </div>
    </form>
  );
}
