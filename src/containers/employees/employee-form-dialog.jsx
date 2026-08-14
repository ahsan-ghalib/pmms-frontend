"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/helper/Loader";
import { employeesApi } from "@/services/employees/employees-api";
import { TextField, SwitchField, UniversalComboBoxField, PasswordField } from "@/components/form-fields";
import { PhoneField } from "@/components/form-fields/phone-input";

export const EmployeeFormDialog = ({
  open,
  onOpenChange,
  employeeId,
  onSuccess,
}) => {
  const t = useTranslations("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!employeeId);
  const isEditing = !!employeeId;
  const [selectedStore, setSelectedStore] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      designation: "",
      store_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    let isMounted = true;
    if (open && employeeId) {
      setIsLoading(true);
      employeesApi
        .getEmployeeById(employeeId)
        .then((response) => {
          if (isMounted) {
            const data = response.data;
            reset({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              password: "", // Keep password empty on edit
              designation: data.designation || "",
              store_id: data.store_id || "",
              is_active: data.is_active,
            });
            if (data.store) {
              setSelectedStore({
                id: String(data.store_id),
                name: data.store.name || "",
              });
            }
          }
        })
        .catch((error) => {
          if (isMounted) {
            toast.error("Failed to load employee details");
            onOpenChange(false);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    } else if (open) {
      reset({
        name: "",
        email: "",
        phone: "",
        password: "",
        designation: "",
        store_id: "",
        is_active: true,
      });
      setSelectedStore(null);
    }

    if (!open) {
      setSelectedStore(null);
    }

    return () => {
      isMounted = false;
    };
  }, [open, employeeId, reset, onOpenChange]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isEditing) {
        if (!data.password) {
          delete data.password;
        }
        await employeesApi.updateEmployee(employeeId, data);
        toast.success("Employee updated successfully");
      } else {
        await employeesApi.createEmployee(data);
        toast.success("Employee created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("Edit_Employee", { defaultMessage: "Edit Employee" }) : t("Add_Employee", { defaultMessage: "Add Employee" })}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <LoadingSpinner className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextField
              label={t("Name", { defaultMessage: "Name" })}
              name="name"
              register={register}
              errors={errors}
              validation={{ required: t("Name_is_required", { defaultMessage: "Name is required" }) }}
            />
            
            <TextField
              label={t("Email", { defaultMessage: "Email" })}
              name="email"
              type="email"
              register={register}
              errors={errors}
              validation={{ required: t("Email_is_required", { defaultMessage: "Email is required" }) }}
            />

            <Controller
              name="phone"
              control={control}
              rules={{ required: false }}
              render={({ field }) => (
                <PhoneField
                  {...field}
                  label="Phone"
                  error={errors.phone?.message}
                  placeholder="+966 551234567"
                />
              )}
            />

            <PasswordField
              label="Password"
              name="password"
              register={register}
              errors={errors}
              validation={{
                required: isEditing ? false : "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" }
              }}
              placeholder={isEditing ? t("Leave_blank_to_keep_current", { defaultMessage: "Leave blank to keep current" }) : ""}
            />

            <TextField
              label={t("Designation", { defaultMessage: "Designation" })}
              name="designation"
              register={register}
              errors={errors}
              validation={{ required: t("Designation_is_required", { defaultMessage: "Designation is required" }) }}
            />

            <UniversalComboBoxField
              label={t("Store", { defaultMessage: "Store" })}
              name="store_id"
              control={control}
              errors={errors}
              validation={{ required: t("Store_is_required", { defaultMessage: "Store is required" }) }}
              apiEndpoint="/stores"
              valueKey="id"
              labelKey="name"
              searchParam="search"
              placeholder={t("Select_store", { defaultMessage: "Select store" })}
              searchPlaceholder="Search stores..."
              selectedItem={selectedStore}
              setSelectedItem={setSelectedStore}
            />

            <SwitchField
              label={t("Active_Status", { defaultMessage: "Active Status" })}
              name="is_active"
              control={control}
              errors={errors}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
