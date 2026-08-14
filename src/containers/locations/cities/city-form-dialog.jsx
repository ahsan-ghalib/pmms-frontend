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
import { TextField, UniversalComboBoxField } from "@/components/form-fields";
import { LoadingSpinner } from "@/helper/Loader";
import { toast } from "sonner";

export function CityFormDialog({ open, onClose, city, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: city?.name || "",
      state_id: city?.state_id || "",
      country_id: city?.country_id || "",
    },
  });

  useEffect(() => {
    reset({
      name: city?.name || "",
      state_id: city?.state_id || "",
      country_id: city?.country_id || "",
    });
  }, [city, reset]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = { ...data };
      delete payload.country_id;
      payload.state_id = parseInt(payload.state_id);

      await onSave(payload, city?.id);

      toast.success(
        city ? "City updated successfully" : "City created successfully"
      );
      onClose();
      if (!city) reset();
    } catch (error) {
      toast.error(city ? "Failed to update city" : "Failed to create city");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent preventOutsideClose={true} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{city ? "Edit City" : "Add New City"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="City Name"
            name="name"
            register={register}
            errors={errors}
            validation={{ required: "City name is required" }}
            placeholder="e.g., Lahore"
          />

          <div className="grid grid-cols-2 gap-4">
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
                city ? { id: city.country_id, name: city.country?.name } : null
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
                city ? { id: city.state_id, name: city.state?.name } : null
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
                  {city ? "Updating..." : "Creating..."}
                </span>
              ) : city ? (
                "Update City"
              ) : (
                "Create City"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
