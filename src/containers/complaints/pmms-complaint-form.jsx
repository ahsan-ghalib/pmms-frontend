"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextareaField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function PmmsComplaintForm() {
  const t = useT("common");
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slots, setSlots] = useState([]);
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      property_id: "",
      category_id: "",
      service_id: "",
      priority: "normal",
      description: "",
      scheduled_date: "",
      scheduled_start_time: "",
      scheduled_end_time: "",
    },
  });

  const categoryId = watch("category_id");
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const services = selectedCategory?.services || [];

  useEffect(() => {
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories({ active_only: true }).then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    complaintsApi.slots({ category_id: categoryId }).then((data) => setSlots(Array.isArray(data) ? data : [])).catch(() => setSlots([]));
  }, [categoryId]);

  const onSubmit = async (values) => {
    try {
      const created = await complaintsApi.create(values);
      toast.success("Complaint submitted");
      router.push(`/complaints/${created.data?.id || ""}`);
    } catch (error) {
      toast.error(apiError(error, "Unable to submit complaint"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader icon={MessageSquareWarning} title={t("new_complaint", { defaultMessage: "New complaint" })} description={t("new_complaint_desc", { defaultMessage: "Capture the issue, category, and preferred slot." })} />
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border rounded-2xl p-6 grid md:grid-cols-2 gap-4">
        <SelectField label="Property" name="property_id" control={control} errors={errors} validation={{ required: "Required" }} options={properties.map((item) => ({ value: item.id, label: item.name }))} />
        <SelectField label="Priority" name="priority" control={control} errors={errors} options={[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }]} />
        <SelectField label="Category" name="category_id" control={control} errors={errors} validation={{ required: "Required" }} options={categories.map((item) => ({ value: item.id, label: item.name_en }))} />
        <SelectField label="Service" name="service_id" control={control} errors={errors} validation={{ required: "Required" }} options={services.map((item) => ({ value: item.id, label: item.name_en }))} />
        <div className="md:col-span-2">
          <TextareaField label="Description" name="description" control={control} errors={errors} validation={{ required: "Required" }} />
        </div>
        <TextField label="Scheduled date" name="scheduled_date" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <SelectField
          label="Available slot"
          name="scheduled_start_time"
          control={control}
          errors={errors}
          options={slots.filter((slot) => slot.available).map((slot) => ({
            value: slot.start_time,
            label: `${slot.date} ${slot.start_time} - ${slot.end_time}`,
          }))}
          onValueChange={(value) => {
            const slot = slots.find((item) => item.start_time === value);
            if (slot) {
              setValue("scheduled_date", slot.date);
              setValue("scheduled_end_time", slot.end_time);
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">Submit complaint</Button>
      </div>
    </form>
  );
}
