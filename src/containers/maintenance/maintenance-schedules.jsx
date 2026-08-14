"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import { TextField, SelectField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { maintenanceApi } from "@/services/settings/settings-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDay, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function MaintenanceSchedules() {
  const t = useT("common");
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const { control, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { property_id: "", category_id: "", service_id: "", frequency: "monthly", next_due_date: "" },
  });
  const categoryId = watch("category_id");
  const services = categories.find((category) => category.id === categoryId)?.services || [];

  const load = async () => {
    try {
      const data = await maintenanceApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, "Failed to load schedules"));
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const columns = [
    { accessorKey: "property", header: "Property", cell: ({ row }) => row.original.property?.name || "—" },
    { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category?.name_en || "—" },
    { accessorKey: "frequency", header: "Frequency", cell: ({ row }) => labelize(row.original.frequency) },
    { accessorKey: "next_due_date", header: "Next due", cell: ({ row }) => formatDay(row.original.next_due_date) },
    { accessorKey: "is_active", header: "Status", cell: ({ row }) => <StatusBadge value={row.original.is_active ? "active" : "inactive"} /> },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={async () => setHistory(await maintenanceApi.history(row.original.id))}>History</Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarClock}
        title={t("pm_schedules", { defaultMessage: "Preventive Maintenance" })}
        description={t("pm_schedules_desc", { defaultMessage: "Schedules generate work orders automatically on the due date." })}
        actions={<Button variant="outline" onClick={async () => { const result = await maintenanceApi.generate(); toast.success(result.message || "Generated"); load(); }}>Generate due now</Button>}
      />
      <form
        onSubmit={handleSubmit(async (values) => {
          try {
            await maintenanceApi.create(values);
            toast.success("Schedule created");
            reset();
            load();
          } catch (error) {
            toast.error(apiError(error, "Unable to create schedule"));
          }
        })}
        className="bg-white/60 border rounded-2xl p-6 grid md:grid-cols-5 gap-4"
      >
        <SelectField label="Property" name="property_id" control={control} errors={errors} validation={{ required: "Required" }} options={properties.map((item) => ({ value: item.id, label: item.name }))} />
        <SelectField label="Category" name="category_id" control={control} errors={errors} validation={{ required: "Required" }} options={categories.map((item) => ({ value: item.id, label: item.name_en }))} />
        <SelectField label="Service" name="service_id" control={control} errors={errors} validation={{ required: "Required" }} options={services.map((item) => ({ value: item.id, label: item.name_en }))} />
        <SelectField label="Frequency" name="frequency" control={control} errors={errors} options={[{ value: "monthly", label: "Monthly" }, { value: "3_months", label: "3 months" }, { value: "6_months", label: "6 months" }, { value: "yearly", label: "Yearly" }]} />
        <TextField label="Next due" name="next_due_date" control={control} errors={errors} validation={{ required: "Required" }} placeholder="YYYY-MM-DD" />
        <div className="md:col-span-5 flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">Create schedule</Button>
        </div>
      </form>
      <DataTable columns={columns} data={rows} columnsBtn={false} />
      {history.length > 0 && (
        <div className="rounded-2xl border bg-white/60 p-5">
          <p className="font-semibold mb-3">Completion history</p>
          {history.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
              <span>{item.work_order_no}</span>
              <StatusBadge value={item.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
