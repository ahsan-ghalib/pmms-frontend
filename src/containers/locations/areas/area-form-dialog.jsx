"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TextField,
  SelectField,
  UniversalComboBoxField,
} from "@/components/form-fields";
import { LoadingSpinner } from "@/helper/Loader";
import { toast } from "sonner";

export function AreaFormDialog({ open, onClose, area, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,

    formState: { errors },
  } = useForm({
    defaultValues: {
      name: area?.name || "",
      city_id: area?.city_id || "",
      state_id: area?.state_id || "",
      country_id: area?.country_id || "",
    },
  });

  useEffect(() => {
    if (area) {
      reset({
        name: area.name || "",
        city_id: area.city_id || "",
        state_id: area.state_id || "",
        country_id: area.country_id || "",
      });
    } else {
      reset({
        name: "",
        city_id: "",
        state_id: "",
        country_id: "",
      });
    }
  }, [area, reset]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = { ...data };
      delete payload.country_id;
      delete payload.state_id;
      payload.city_id = parseInt(payload.city_id);

      await onSave(payload, area?.id);

      toast.success(
        area ? "Area updated successfully" : "Area created successfully"
      );
      onClose();
      if (!area) reset();
    } catch (error) {
      toast.error(area ? "Failed to update area" : "Failed to create area");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent preventOutsideClose={true} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{area ? "Edit Area" : "Add New Area"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="Area Name"
            name="name"
            register={register}
            errors={errors}
            validation={{ required: "Area name is required" }}
            placeholder="e.g., Gulberg"
          />

          <div className="grid grid-cols-3 gap-4">
            <UniversalComboBoxField
              label="Country"
              name="country_id"
              control={control}
              errors={errors}
              validation={{}}
              apiEndpoint="/locations/countries"
              valueKey="id"
              labelKey="name"
              searchParam="search"
              placeholder="Select country"
              searchPlaceholder="Search countries..."
              dataToStore="countries"
              selectedItem={
                area ? { id: area.country_id, name: area.country?.name } : null
              }
            />

            <UniversalComboBoxField
              label="State"
              name="state_id"
              control={control}
              errors={errors}
              validation={{ required: "State is required" }}
              apiEndpoint="/locations/states"
              valueKey="id"
              labelKey="name"
              searchParam="search"
              placeholder="Select state"
              searchPlaceholder="Search states..."
              dataToStore="states"
              selectedItem={
                area ? { id: area.state_id, name: area.state?.name } : null
              }
            />

            <UniversalComboBoxField
              label="City"
              name="city_id"
              control={control}
              errors={errors}
              validation={{ required: "City is required" }}
              apiEndpoint="/locations/cities"
              valueKey="id"
              labelKey="name"
              searchParam="search"
              placeholder="Select city"
              searchPlaceholder="Search cities..."
              dataToStore="cities"
              selectedItem={
                area ? { id: area.city_id, name: area.city?.name } : null
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner className="h-4 w-4 animate-spin" />
                  {area ? "Updating..." : "Creating..."}
                </span>
              ) : area ? (
                "Update Area"
              ) : (
                "Create Area"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
