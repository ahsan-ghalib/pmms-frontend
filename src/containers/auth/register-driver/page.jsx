"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/layouts/language-toggle";
import { useLandingAuthTheme } from "@/hooks/use-landing-auth-theme";
import "@/app/landing-theme.css";

const COUNTRIES = [
  { prefix: "SA", dial_code: "+966" },
  { prefix: "AE", dial_code: "+971" },
  { prefix: "EG", dial_code: "+20" },
  { prefix: "KW", dial_code: "+965" },
  { prefix: "QA", dial_code: "+974" },
  { prefix: "BH", dial_code: "+973" },
  { prefix: "OM", dial_code: "+968" },
  { prefix: "JO", dial_code: "+962" },
  { prefix: "LB", dial_code: "+961" },
  { prefix: "US", dial_code: "+1" },
];

export default function RegisterDriver() {
  const t = useTranslations("messages");
  const [isSuccess, setIsSuccess] = useState(false);
  const { theme, toggleTheme } = useLandingAuthTheme();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      dial_code: "+966",
      phone: "",
      driver_type: "bike",
      password: "",
      password_confirmation: "",
    },
    mode: "onBlur",
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    setIsSuccess(false);
    try {
      const response = await axiosInstance.post("/auth/driver-register", data);

      if (response.status === 200 || response.status === 201) {
        setIsSuccess(true);
        toast.success("Driver registered successfully!");
        reset();
      } else {
        toast.error(response.data?.message || "Registration failed");
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((messages) => {
          toast.error(Array.isArray(messages) ? messages[0] : messages);
        });
      } else {
        toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
      }
    }
  };

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
          className="glass-card px-3 py-2 text-sm rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
          title={t("home") === "messages.home" ? "Home" : t("home")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <LanguageToggle />
        <button
          onClick={toggleTheme}
          className="glass-card px-3 py-2 text-sm rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors"
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-md mt-12 mb-8 z-10 relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/images/logo.png"
              alt="SoouqLive"
              width={120}
              height={48}
              className="h-12 mx-auto object-contain"
            />
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-[var(--t-heading)]">
            {t("driver_registration") === "messages.driver_registration" ? "Driver Registration" : t("driver_registration")}
          </h1>
          <p className="text-[var(--t-text-muted)]">
            {t("driver_register_lead") === "messages.driver_register_lead" ? "Create your driver account to start delivering." : t("driver_register_lead")}
          </p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {isSuccess && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center">
              {t("driver_registration_success") === "messages.driver_registration_success" ? "Driver account created successfully. Your profile is pending verification." : t("driver_registration_success")}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("full_name") === "messages.full_name" ? "Full Name" : t("full_name")} *
              </label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all"
                placeholder={t("full_name") === "messages.full_name" ? "Full Name" : t("full_name")}
              />
              {errors.name && <span className="text-red-400 text-sm mt-1 block">{errors.name.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("email") === "messages.email" ? "Email Address" : t("email")} *
              </label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all"
                placeholder={t("email") === "messages.email" ? "Email Address" : t("email")}
              />
              {errors.email && <span className="text-red-400 text-sm mt-1 block">{errors.email.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("phone_number") === "messages.phone_number" ? "Phone Number" : t("phone_number")} *
              </label>
              <div className="flex gap-2">
                <select
                  {...register("dial_code")}
                  className="w-32 shrink-0 bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-2 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all [&>option]:bg-gray-900 [&>option]:text-white"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.dial_code} value={country.dial_code}>
                      {country.prefix} ({country.dial_code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  {...register("phone", { required: "Phone number is required" })}
                  className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all"
                  placeholder={t("phone_number") === "messages.phone_number" ? "Phone Number" : t("phone_number")}
                />
              </div>
              {errors.phone && <span className="text-red-400 text-sm mt-1 block">{errors.phone.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("driver_type") === "messages.driver_type" ? "Driver Type" : t("driver_type")} *
              </label>
              <select
                {...register("driver_type")}
                className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all [&>option]:bg-gray-900 [&>option]:text-white"
              >
                <option value="bike">{t("driver_type_bike") === "messages.driver_type_bike" ? "Bike" : t("driver_type_bike")}</option>
                <option value="car">{t("driver_type_car") === "messages.driver_type_car" ? "Car" : t("driver_type_car")}</option>
                <option value="van">{t("driver_type_van") === "messages.driver_type_van" ? "Van" : t("driver_type_van")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("password") === "messages.password" ? "Password" : t("password")} *
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
                className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all"
                placeholder={t("password") === "messages.password" ? "Password" : t("password")}
              />
              {errors.password && <span className="text-red-400 text-sm mt-1 block">{errors.password.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--t-text)] mb-1">
                {t("confirm_password") === "messages.confirm_password" ? "Confirm Password" : t("confirm_password")} *
              </label>
              <input
                type="password"
                {...register("password_confirmation", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
                className="w-full bg-white/5 border border-[var(--t-border)] text-[var(--t-text)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)] transition-all"
                placeholder={t("confirm_password") === "messages.confirm_password" ? "Confirm Password" : t("confirm_password")}
              />
              {errors.password_confirmation && <span className="text-red-400 text-sm mt-1 block">{errors.password_confirmation.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 !text-white font-semibold rounded-xl px-6 py-4 transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                t("create_account") === "messages.create_account" ? "Create Account" : t("create_account")
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-[var(--t-text-muted)]">
          <Link href="/register" className="hover:text-[var(--t-accent)] transition-colors">
            &larr; {t("back_to_options") === "messages.back_to_options" ? "Back to options" : t("back_to_options")}
          </Link>
        </div>
      </div>
    </div>
  );
}
