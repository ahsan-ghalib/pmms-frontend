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

export function StateFormDialog({ open, onClose, state, onSave }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      country_id: "",
    },
  });

  useEffect(() => {
    if (state) {
      reset({
        name: state.name || "",
        country_id: state.country_id?.toString() || "",
      });
    } else {
      reset({
        name: "",
        country_id: "",
      });
    }
  }, [state, reset, open]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSave({ ...data, country_id: parseInt(data.country_id) }, state?.id);
      toast.success(
        state ? "State updated successfully" : "State created successfully"
      );
      onClose();
      if (!state) {
        reset();
      }
    } catch (error) {
      toast.error(state ? "Failed to update state" : "Failed to create state");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent preventOutsideClose={true} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{state ? "Edit State" : "Add New State"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="State Name"
            name="name"
            register={register}
            errors={errors}
            validation={{ required: "State name is required" }}
            placeholder="e.g., Punjab"
          />

          <UniversalComboBoxField
            label="Country"
            name="country_id"
            control={control}
            errors={errors}
            validation={{ required: "Country is required" }}
            apiEndpoint="/locations/countries"
            valueKey="id"
            labelKey="name"
            searchParam="search"
            placeholder="Select country"
            searchPlaceholder="Search countries..."
            dataToStore="countries"
            selectedItem={
              state ? { id: state.country_id, name: state.country?.name } : null
            }
          />

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
                  {state ? "Updating..." : "Creating..."}
                </span>
              ) : state ? (
                "Update State"
              ) : (
                "Create State"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
