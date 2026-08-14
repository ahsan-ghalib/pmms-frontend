import React, { useEffect, useState, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";
import axiosInstance from "@/lib/axios";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import { useTranslations } from "next-intl";

const FileUpload = ({ name, label, control, rules }) => {
  const t = useTranslations("messages");
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const onDrop = useCallback((acceptedFiles) => {
          if (acceptedFiles?.length > 0) {
            onChange(acceptedFiles[0]);
          }
        }, [onChange]);

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
          onDrop,
          maxFiles: 1,
          accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
          }
        });

        const handleRemove = (e) => {
          e.stopPropagation();
          onChange(null);
        };

        return (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/90">
              {label} {rules?.required && <span className="text-red-400">*</span>}
            </label>
            
            {!value ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                  ${isDragActive ? "border-orange-400 bg-orange-400/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}
                  ${error ? "border-red-500/50 bg-red-500/5" : ""}
                `}
              >
                <input {...getInputProps()} />
                <UploadCloud className={`w-8 h-8 mb-2 ${isDragActive ? "text-orange-400" : "text-white/40"}`} />
                <p className="text-sm text-white/70">
                  <span className="font-semibold text-white">{t("VendorSetup_Click_Upload")}</span> {t("VendorSetup_Drag_Drop")}
                </p>
                <p className="text-xs text-white/40 mt-1">{t("VendorSetup_File_Types_Image")}</p>
              </div>
            ) : (
              <div className="border border-white/20 rounded-xl p-4 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                    <File className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-white truncate">{value.name}</p>
                    <p className="text-xs text-white/50">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {error && <p className="text-red-400 text-sm mt-1">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};

export default function Step1Basic() {
  const t = useTranslations("messages");
  const { register, control, watch, formState: { errors } } = useFormContext();
  const acceptTermsValue = watch("accept_terms");
  const [accountTypes, setAccountTypes] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, actRes] = await Promise.all([
          axiosInstance.get("/settings/account-types"),
          axiosInstance.get("/settings/activity-types")
        ]);
        setAccountTypes(accRes.data?.data || []);
        setActivityTypes(actRes.data?.data || []);
      } catch (err) {
        console.error("Error fetching types", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{t("VendorSetup_Basic_Info_Title")}</h3>
        <p className="text-white/70 text-sm">{t("VendorSetup_Basic_Info_Desc")}</p>
      </div>

      <div className="space-y-4">
        {/* Account Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/90">{t("VendorSetup_Account_Type")} <span className="text-red-400">*</span></label>
          <select
            {...register("account_type", { required: t("VendorSetup_Account_Type") + " is required" })}
            className={`w-full bg-white/5 border ${
              errors.account_type ? "border-red-500/50" : "border-white/10"
            } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors [&>option]:bg-gray-900`}
          >
            <option value="">{t("VendorSetup_Select_Account_Type")}</option>
            {accountTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          {errors.account_type && (
            <p className="text-red-400 text-sm mt-1">{errors.account_type.message}</p>
          )}
        </div>

        {/* Activity Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/90">{t("VendorSetup_Activity_Type")} <span className="text-red-400">*</span></label>
          <select
            {...register("activity_type", { required: t("VendorSetup_Activity_Type") + " is required" })}
            className={`w-full bg-white/5 border ${
              errors.activity_type ? "border-red-500/50" : "border-white/10"
            } rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors [&>option]:bg-gray-900`}
          >
            <option value="">{t("VendorSetup_Select_Activity_Type")}</option>
            {activityTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          {errors.activity_type && (
            <p className="text-red-400 text-sm mt-1">{errors.activity_type.message}</p>
          )}
        </div>

        {/* Is Food Vendor */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-medium text-white block">{t("VendorSetup_Food_Vendor_Label")}</span>
              <span className="text-xs text-white/50">{t("VendorSetup_Food_Vendor_Hint")}</span>
            </div>
            <div className="relative inline-flex items-center">
              <input type="checkbox" {...register("is_food_vendor")} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </div>
          </label>
        </div>

        {/* Store Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/90">{t("VendorSetup_Store_Name")} <span className="text-red-400">*</span></label>
          <input
            type="text"
            placeholder={t("VendorSetup_Store_Name_Placeholder")}
            {...register("store_name", { required: t("VendorSetup_Store_Name") + " is required" })}
            className={`w-full bg-white/5 border ${
              errors.store_name ? "border-red-500/50" : "border-white/10"
            } rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors`}
          />
          {errors.store_name && (
            <p className="text-red-400 text-sm mt-1">{errors.store_name.message}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FileUpload 
            name="logo" 
            label={t("VendorSetup_Store_Logo")} 
            control={control} 
            rules={{ required: false }} 
          />
          <FileUpload 
            name="cover_photo" 
            label={t("VendorSetup_Store_Cover_Photo")} 
            control={control} 
            rules={{ required: false }} 
          />
        </div>

        {/* Accept Terms */}
        <div className="pt-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1 shrink-0">
              <input
                type="checkbox"
                {...register("accept_terms", { required: "You must accept the terms" })}
                className="sr-only"
              />
              {/* Custom visual checkbox controlled by watched value */}
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  acceptTermsValue
                    ? "bg-green-500 border-green-500"
                    : "bg-white/5 border-white/30"
                }`}
              >
                {acceptTermsValue && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
              {t.rich("VendorSetup_Accept_Terms", {
                terms: (chunks) => <a href="#" className="text-orange-400 hover:underline">{chunks}</a>,
                privacy: (chunks) => <a href="#" className="text-orange-400 hover:underline">{chunks}</a>
              })}
            </span>
          </label>
          {errors.accept_terms && (
            <p className="text-red-400 text-sm mt-1">{errors.accept_terms.message}</p>
          )}
        </div>

      </div>
    </div>
  );
}
