"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/layouts/language-toggle";
import { useLandingAuthTheme } from "@/hooks/use-landing-auth-theme";
import axiosInstance from "@/lib/axios";
import { useSession } from "next-auth/react";
import "@/app/landing-theme.css";

import Step1Basic from "./steps/Step1Basic";
import Step2Commercial from "./steps/Step2Commercial";
import Step3Location from "./steps/Step3Location";

const getSteps = (t) => [
  { id: "basic", label: t("VendorSetup_Step_Basic") },
  { id: "commercial", label: t("VendorSetup_Step_Commercial") },
  { id: "location", label: t("VendorSetup_Step_Location") },
];

export default function RegisterVendorSetup() {
  const t = useTranslations("messages");
  const STEPS = getSteps(t);
  const router = useRouter();
  const { theme } = useLandingAuthTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { data: session, update: updateSession } = useSession();
  
  const methods = useForm({
    defaultValues: {
      account_type: "",
      activity_type: "",
      store_name: "",
      accept_terms: false,
      commercial_license: null,
      commercial_registration_number: "",
      nic_front: null,
      nic_back: null,
      is_vat_registered: false,
      vat_number: "",
      vat_certificate: null,
      bank_name: "",
      iban_number: "SA",
      account_title: "",
      account_number: "",
      iban_picture: null,
      city: "",
      lat: "",
      lng: "",
    },
    mode: "onChange"
  });

  const { handleSubmit, trigger, formState: { isSubmitting }, reset } = methods;

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("vendor_setup_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        reset(parsed.data);
        setCurrentStep(parsed.step || 0);
      } catch (e) {
        console.error("Failed to parse saved state");
      }
    }
  }, [reset]);

  useEffect(() => {
    if (session?.user?.profile_completed) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (isClient) {
        localStorage.setItem("vendor_setup_state", JSON.stringify({
          step: currentStep,
          data: value
        }));
      }
    });
    return () => subscription.unsubscribe();
  }, [methods.watch, currentStep, isClient]);

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (currentStep === 0) {
      fieldsToValidate = ['account_type', 'activity_type', 'store_name', 'accept_terms'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['commercial_registration_number', 'bank_name', 'iban_number', 'account_title', 'commercial_license', 'nic_front', 'nic_back', 'iban_picture'];
      if (methods.getValues('is_vat_registered')) {
        fieldsToValidate.push('vat_number', 'vat_certificate');
      }
    }

    const isValid = await trigger(fieldsToValidate);
    
    if (currentStep === 0 && !methods.getValues("accept_terms")) {
      toast.error(t("VendorSetup_Terms") + " is required.");
      return;
    }

    if (isValid) {
      const data = methods.getValues();
      try {
        if (currentStep === 0) {
          const formData = new FormData();
          formData.append('account_type_id', data.account_type);
          formData.append('activity_type_id', data.activity_type);
          formData.append('is_food_vendor', data.is_food_vendor ? 1 : 0);
          formData.append('store_name', data.store_name);
          formData.append('terms_accepted', data.accept_terms ? 1 : 0);
          
          if (data.logo) formData.append('logo', data.logo);
          if (data.cover_photo) formData.append('cover_photo', data.cover_photo);

          await axiosInstance.post('/vendor/activity-information', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else if (currentStep === 1) {
          const formData = new FormData();
          formData.append('commercial_registration_number', data.commercial_registration_number);
          formData.append('is_vat_registered', data.is_vat_registered ? 1 : 0);
          if (data.is_vat_registered) {
            formData.append('vat_number', data.vat_number);
            if (data.vat_certificate) formData.append('vat_certificate_file', data.vat_certificate);
          }
          if (data.commercial_license) formData.append('commercial_license_file', data.commercial_license);
          if (data.nic_front) formData.append('national_id_front_file', data.nic_front);
          if (data.nic_back) formData.append('national_id_back_file', data.nic_back);

          formData.append('bank_id', data.bank_name); // Here we will use the ID
          formData.append('iban_number', data.iban_number);
          formData.append('account_title', data.account_title);
          if (data.account_number) formData.append('account_number', data.account_number);
          if (data.iban_picture) formData.append('iban_certificate_file', data.iban_picture);

          await axiosInstance.post('/vendor/business-information', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      } catch (error) {
        if (error.response?.data?.errors) {
          const errs = error.response.data.errors;
          Object.keys(errs).forEach((key) => {
            toast.error(errs[key][0] || errs[key]);
          });
        } else {
          toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("Please fill in all required fields correctly.");
    }

  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data) => {
    try {
      if (currentStep === 2) {
        const payload = {
          city_id: data.city, // The user will select the city_id
          latitude: data.lat,
          longitude: data.lng,
          google_place_id: data.google_place_id || null,
          formatted_address: data.formatted_address || null,
        };
        await axiosInstance.post('/vendor/location-information', payload);
        await updateSession({ profile_completed: true, vendor_status: 'pending' });
      }

      toast.success(t("VendorSetup_Finish_Setup") + " - " + "Your information has been saved.");
      localStorage.removeItem("vendor_setup_state");
      router.push("/pending-verification");
    } catch (error) {
      if (error.response?.data?.errors) {
        const errs = error.response.data.errors;
        Object.keys(errs).forEach((key) => {
          toast.error(errs[key][0] || errs[key]);
        });
      } else {
        toast.error(error.response?.data?.message || "Failed to complete setup.");
      }
    }
  };

  if (!isClient) return null;

  return (
    <div className="landing-page-wrapper min-h-screen flex items-center justify-center p-4">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/login-bg.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        {/* Dynamic overlay based on theme - uniform for centered layout */}
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm transition-colors duration-300"></div>
      </div>
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-50 flex items-center gap-2">
        <Link
          href="/"
          className="glass-card p-2.5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Home"
        >
          <Home className="w-4 h-4 text-white" />
        </Link>
        <button
          type="button"
          onClick={async () => {
            const { signOut } = await import("next-auth/react");
            await signOut({ callbackUrl: "/login" });
          }}
          className="glass-card p-2.5 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-white" />
        </button>
        <LanguageToggle />
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Side: Illustration / Welcome */}
        <div className="md:col-span-4 flex flex-col justify-center h-full text-white space-y-6 hidden md:flex pt-12">
          <div>
            <Image 
              src={theme === "light" ? "/images/logo.png" : "/images/logo-white.png"}
              alt="SoouqLive" 
              width={160} 
              height={45} 
              className="mb-8"
              priority
            />
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {t("VendorSetup_Complete_your")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400">
                {t("VendorSetup_Store_Setup")}
              </span>
            </h1>
            <p className="text-white/80 text-lg">
              {t("VendorSetup_desc")}
            </p>
          </div>

          <div className="space-y-4 pt-8">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  currentStep > idx ? "bg-green-500 text-white" : 
                  currentStep === idx ? "bg-white text-primary" : 
                  "bg-white/10 text-white/50"
                }`}>
                  {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`font-medium ${currentStep >= idx ? "text-white" : "text-white/50"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form Wizard */}
        <div className="md:col-span-8">
          <div className="glass-card p-6 md:p-8 rounded-3xl w-full">
            <div className="mb-8 md:hidden">
              <h2 className="text-2xl font-bold text-white mb-2">{t("VendorSetup_Store_Setup")}</h2>
              <div className="flex items-center gap-2">
                <span className="text-white/70">{t("VendorSetup_Step_of", { current: currentStep + 1, total: STEPS.length })}</span>
              </div>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                
                <div className="min-h-[450px]">
                  {currentStep === 0 && <Step1Basic />}
                  {currentStep === 1 && <Step2Commercial />}
                  {currentStep === 2 && <Step3Location />}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      currentStep === 0 
                      ? "opacity-0 pointer-events-none" 
                      : "text-white bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t("VendorSetup_Back")}
                  </button>

                  {currentStep < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:opacity-90 transition-opacity"
                    >
                      {t("VendorSetup_Next_Step")}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("VendorSetup_Submitting")}
                        </>
                      ) : (
                        <>
                          {t("VendorSetup_Finish_Setup")}
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </FormProvider>

          </div>
        </div>
      </div>
    </div>
  );
}
