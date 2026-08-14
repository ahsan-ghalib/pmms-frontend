"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import dynamic from "next/dynamic";
import axiosInstance from "@/lib/axios";
import { useTranslations } from "next-intl";

import UniversalComboBoxField from "@/components/form-fields/universal-combobox-field";

const LocationPickerMap = dynamic(
  () => import("@/components/common/location-picker-map"),
  { ssr: false }
);

export default function Step3Location() {
  const t = useTranslations("messages");
  const { register, setValue, watch, formState: { errors }, control } = useFormContext();
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const currentLat = watch("lat");
  const currentLng = watch("lng");

  const handleLocationChange = useCallback((lat, lng) => {
    setValue("lat", lat.toString(), { shouldValidate: true });
    setValue("lng", lng.toString(), { shouldValidate: true });
  }, [setValue]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{t("VendorSetup_Location_Title")}</h3>
        <p className="text-white/70 text-sm">{t("VendorSetup_Location_Desc")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 flex-shrink-0">
        <UniversalComboBoxField
          name="country"
          label={t("VendorSetup_Country")}
          control={control}
          placeholder={t("VendorSetup_Select_Country")}
          searchPlaceholder={t("VendorSetup_Search_Country")}
          emptyMessage={t("VendorSetup_No_Countries")}
          apiEndpoint="/settings/countries"
          valueKey="id"
          labelKey="name"
          variant="auth"
          onValueChange={(val) => {
            setSelectedCountry(val);
            setSelectedState("");
            setValue("state", "", { shouldValidate: true });
            setValue("city", "", { shouldValidate: true });
          }}
        />

        <UniversalComboBoxField
          name="state"
          label={t("VendorSetup_State")}
          control={control}
          placeholder={t("VendorSetup_Select_State")}
          searchPlaceholder={t("VendorSetup_Search_State")}
          emptyMessage={t("VendorSetup_No_States")}
          apiEndpoint="/settings/states"
          params={{ country_id: selectedCountry }}
          valueKey="id"
          labelKey="name"
          variant="auth"
          disabled={!selectedCountry}
          onValueChange={(val) => {
            setSelectedState(val);
            setValue("city", "", { shouldValidate: true });
          }}
        />

        <UniversalComboBoxField
          name="city"
          label={t("VendorSetup_City")}
          control={control}
          placeholder={t("VendorSetup_Select_City")}
          searchPlaceholder={t("VendorSetup_Search_City")}
          emptyMessage={t("VendorSetup_No_Cities")}
          apiEndpoint="/settings/cities"
          params={{ state_id: selectedState }}
          valueKey="id"
          labelKey="name"
          variant="auth"
          disabled={!selectedState}
          validation={{ required: "City name is required" }}
          errors={errors}
        />

        <div className="space-y-1.5 hidden">
          <label className="text-sm font-medium text-white/90">Latitude <span className="text-red-400">*</span></label>
          <input
            type="text"
            readOnly
            {...register("lat", { required: "Latitude is required (select on map)" })}
            className={`w-full bg-white/5 border ${errors.lat ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white/50 outline-none cursor-not-allowed`}
          />
        </div>
        <div className="space-y-1.5 hidden">
          <label className="text-sm font-medium text-white/90">Longitude <span className="text-red-400">*</span></label>
          <input
            type="text"
            readOnly
            {...register("lng", { required: "Longitude is required (select on map)" })}
            className={`w-full bg-white/5 border ${errors.lng ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white/50 outline-none cursor-not-allowed`}
          />
        </div>
      </div>
      
      {/* Map Container */}
      <div className="flex-grow min-h-[400px] bg-white/5 border border-white/10 rounded-xl relative overflow-hidden mt-4 p-4">
        <LocationPickerMap
          latitude={currentLat}
          longitude={currentLng}
          onLocationChange={handleLocationChange}
          height="400px"
        />
      </div>
      {(errors.lat || errors.lng) && (
        <p className="text-red-400 text-sm mt-1">{t("VendorSetup_Map_Select_Location")}</p>
      )}
    </div>
  );
}
