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
import { TextField, SelectField } from "@/components/form-fields";
import { LoadingSpinner } from "@/helper/Loader";
import { toast } from "sonner";

export function CountryFormDialog({ open, onClose, country, onSave }) {
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
      code: "",
      phone_code: "",
    },
  });

  useEffect(() => {
    if (country) {
      reset({
        name: country.name || "",
        code: country.code || "",
        phone_code: country.phone_code || "",
      });
    } else {
      reset({
        name: "",
        code: "",
        phone_code: "",
      });
    }
  }, [country, reset, open]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      await onSave(data, country?.id);
      toast.success(
        country
          ? "Country updated successfully"
          : "Country created successfully"
      );
      onClose();
      if (!country) {
        reset();
      }
    } catch (error) {
      toast.error(
        country ? "Failed to update country" : "Failed to create country"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent preventOutsideClose={true} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {country ? "Edit Country" : "Add New Country"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextField
            label="Country Name"
            name="name"
            register={register}
            errors={errors}
            validation={{ required: "Country name is required" }}
            placeholder="e.g., Pakistan"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Code"
              name="code"
              register={register}
              errors={errors}
              validation={{ required: "Code is required", maxLength: 2 }}
              placeholder="e.g., PK"
            />

            <TextField
              label="Phone Code"
              name="phone_code"
              register={register}
              errors={errors}
              validation={{ required: "Phone code is required" }}
              placeholder="e.g., +92"
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
                  {country ? "Updating..." : "Creating..."}
                </span>
              ) : country ? (
                "Update Country"
              ) : (
                "Create Country"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
