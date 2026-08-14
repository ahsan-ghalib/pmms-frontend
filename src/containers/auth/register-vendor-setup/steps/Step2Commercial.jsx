import React, { useCallback, useState, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X } from "lucide-react";
import axiosInstance from "@/lib/axios";
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
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
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
                <p className="text-xs text-white/40 mt-1">{t("VendorSetup_File_Types_Doc")}</p>
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

export default function Step2Commercial() {
  const t = useTranslations("messages");
  const { register, control, watch, formState: { errors } } = useFormContext();
  const [banks, setBanks] = useState([]);
  
  const isVatRegistered = watch("is_vat_registered");

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axiosInstance.get("/settings/banks");
        setBanks(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching banks", err);
      }
    };
    fetchBanks();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      
      {/* Commercial Section */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">{t("VendorSetup_Commercial_Title")}</h3>
        <div className="space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">{t("VendorSetup_CR_Number")} <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder={t("VendorSetup_CR_Placeholder")}
                {...register("commercial_registration_number", { required: t("VendorSetup_CR_Number") + " is required" })}
                className={`w-full bg-white/5 border ${errors.commercial_registration_number ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors`}
              />
              {errors.commercial_registration_number && <p className="text-red-400 text-sm">{errors.commercial_registration_number.message}</p>}
            </div>
            
            <FileUpload 
              name="commercial_license" 
              label={t("VendorSetup_Commercial_License")} 
              control={control} 
              rules={{ required: "License document is required" }} 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FileUpload 
              name="nic_front" 
              label={t("VendorSetup_NIC_Front")} 
              control={control} 
              rules={{ required: "NIC Front is required" }} 
            />
            <FileUpload 
              name="nic_back" 
              label={t("VendorSetup_NIC_Back")} 
              control={control} 
              rules={{ required: "NIC Back is required" }} 
            />
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-white block">{t("VendorSetup_VAT_Registered_Label")}</span>
                <span className="text-xs text-white/50">{t("VendorSetup_VAT_Registered_Hint")}</span>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("is_vat_registered")} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </div>
            </label>

            {isVatRegistered && (
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/90">{t("VendorSetup_VAT_Number")} <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    placeholder={t("VendorSetup_VAT_Number_Placeholder")}
                    {...register("vat_number", { required: "VAT Number is required when registered" })}
                    className={`w-full bg-white/5 border ${errors.vat_number ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors`}
                  />
                  {errors.vat_number && <p className="text-red-400 text-sm">{errors.vat_number.message}</p>}
                </div>
                <FileUpload 
                  name="vat_certificate" 
                  label={t("VendorSetup_VAT_Certificate")} 
                  control={control} 
                  rules={{ required: "VAT Certificate is required when registered" }} 
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Banking Section */}
      <div className="pt-8 border-t border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">{t("VendorSetup_Bank_Details_Title")}</h3>
        <div className="space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">{t("VendorSetup_Bank_Name")} <span className="text-red-400">*</span></label>
              <select
                {...register("bank_name", { required: "Bank Name is required" })}
                className={`w-full bg-white/5 border ${errors.bank_name ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors [&>option]:bg-gray-900`}
              >
                <option value="">{t("VendorSetup_Select_Bank")}</option>
                {banks.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.bank_name && <p className="text-red-400 text-sm mt-1">{errors.bank_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">{t("VendorSetup_IBAN_Number")} <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="SA..."
                {...register("iban_number", { required: "IBAN is required" })}
                className={`w-full bg-white/5 border ${errors.iban_number ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors`}
              />
              {errors.iban_number && <p className="text-red-400 text-sm mt-1">{errors.iban_number.message}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">{t("VendorSetup_Account_Title")} <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder={t("VendorSetup_Account_Title_Placeholder")}
                {...register("account_title", { required: "Account Title is required" })}
                className={`w-full bg-white/5 border ${errors.account_title ? "border-red-500/50" : "border-white/10"} rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors`}
              />
              {errors.account_title && <p className="text-red-400 text-sm mt-1">{errors.account_title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/90">
                {t("VendorSetup_Account_Number")} <span className="text-white/40 font-normal">({t("VendorSetup_Account_Number_Optional")})</span>
              </label>
              <input
                type="text"
                placeholder={t("VendorSetup_Account_Number_Placeholder")}
                {...register("account_number")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FileUpload 
              name="iban_picture" 
              label={t("VendorSetup_IBAN_Proof")} 
              control={control} 
              rules={{ required: "IBAN Proof is required" }} 
            />
          </div>

        </div>
      </div>

    </div>
  );
}
