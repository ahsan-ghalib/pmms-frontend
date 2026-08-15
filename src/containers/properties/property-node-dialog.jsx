"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TextField, SelectField } from "@/components/form-fields";
import { useT } from "@/lib/use-t";

const LocationPickerMap = dynamic(
  () => import("@/components/common/location-picker-map"),
  { ssr: false }
);

const LOCATION_TYPES = ["building", "wing", "block", "floor", "zone", "parking"];
const UNIT_TYPES = ["residential", "office", "retail", "common", "vacant", "storage"];

export default function PropertyNodeDialog({ open, mode, node, onClose, onSubmit, busy }) {
  const t = useT("common");
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: "",
      code: "",
      type: "building",
      unit_type: "residential",
      status: "active",
      latitude: "",
      longitude: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: node?.name || "",
      code: node?.code || "",
      type: node?.type || "building",
      unit_type: node?.unit_type || "residential",
      status: node?.status || "active",
      latitude: node?.latitude ?? "",
      longitude: node?.longitude ?? "",
    });
  }, [open, node, reset]);

  const title = {
    location: node?.id ? t("edit_location", { defaultMessage: "Edit location" }) : t("add_location", { defaultMessage: "Add location" }),
    sub: node?.id ? t("edit_sub_location", { defaultMessage: "Edit sub-location" }) : t("add_sub_location", { defaultMessage: "Add sub-location" }),
    unit: node?.id ? t("edit_unit", { defaultMessage: "Edit unit" }) : t("add_unit", { defaultMessage: "Add unit" }),
  }[mode];

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const handleLocationChange = useCallback((lat, lng) => {
    setValue("latitude", lat, { shouldDirty: true });
    setValue("longitude", lng, { shouldDirty: true });
  }, [setValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={handleSubmit((values) => onSubmit({
            ...values,
            latitude: values.latitude === "" ? null : Number(values.latitude),
            longitude: values.longitude === "" ? null : Number(values.longitude),
          }))}
        >
          <TextField label={t("name", { defaultMessage: "Name" })} name="name" control={control} errors={errors} validation={{ required: true }} />
          <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: true }} />
          {mode === "location" && (
            <SelectField
              label={t("type", { defaultMessage: "Type" })}
              name="type"
              control={control}
              options={LOCATION_TYPES.map((value) => ({ value, label: t(`loc_type_${value}`, { defaultMessage: value }) }))}
            />
          )}
          {mode === "unit" && (
            <SelectField
              label={t("unit_type", { defaultMessage: "Unit type" })}
              name="unit_type"
              control={control}
              options={UNIT_TYPES.map((value) => ({ value, label: t(`unit_type_${value}`, { defaultMessage: value }) }))}
            />
          )}
          <SelectField
            label={t("status", { defaultMessage: "Status" })}
            name="status"
            control={control}
            options={[
              { value: "active", label: t("active", { defaultMessage: "Active" }) },
              { value: "inactive", label: t("inactive", { defaultMessage: "Inactive" }) },
            ]}
          />
          {mode !== "unit" && (
            <div className="space-y-3">
              <LocationPickerMap
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
                height="240px"
                searchPlaceholder={t("prop_maps_search", { defaultMessage: "Search an address or place..." })}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField label={t("latitude", { defaultMessage: "Latitude" })} name="latitude" control={control} />
                <TextField label={t("longitude", { defaultMessage: "Longitude" })} name="longitude" control={control} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button type="submit" disabled={busy} className="bg-violet-600 hover:bg-violet-700">
              {t("save_changes", { defaultMessage: "Save changes" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
