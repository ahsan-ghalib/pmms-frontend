"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  Building2,
  ClipboardList,
  Shield,
  ArrowRight,
  Wrench,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import BrandMark from "@/components/landing/BrandMark";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/layouts/language-toggle";
import "@/app/landing-theme.css";

export default function LoginForm() {
  const t = useTranslations("messages");
  const [showPassword, setShowPassword] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const router = useRouter();

  useEffect(() => {
    if (errors.email) toast.error(errors.email.message);
    if (errors.password) toast.error(errors.password.message);
  }, [errors]);

  const onSubmit = async (data) => {
    try {
      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (!res?.error) {
        if (typeof window !== 'undefined') {
          const { getUserPermissions } = await import("@/lib/permissions");
          await getUserPermissions();
          
          const { getSession } = await import("next-auth/react");
          const session = await getSession();
          if (session?.user?.vendor_info) {
            localStorage.setItem("vendor_info", JSON.stringify(session.user.vendor_info));
          }
          if (session?.user?.language) {
            const { persistLocale } = await import("@/lib/locale-utils");
            persistLocale(session.user.language);
          }
          
          toast.success(t("Login_Success"), {
            duration: 1000,
          });
          
          setTimeout(() => {
            if (session?.user?.role === "vendor") {
              if (!session?.user?.profile_completed) {
                router.push("/register/vendor/setup");
                return;
              }
              if (session?.user?.vendor_status !== "approved") {
                router.push("/pending-verification");
                return;
              }
            }
            router.push("/dashboard");
          }, 1000);
        }
      } else {
        if (res.error === "CredentialsSignin") {
          toast.error(t("Login_Invalid_Credentials"));
        } else {
          toast.error(t("Login_Failed"));
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(t("Login_Error"));
    }
  };

  return (
    <div className="landing-page-wrapper min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Top right actions */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-50 flex items-center gap-2">
        <Link 
          href="/" 
          className="glass-card px-3 py-2 text-sm rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors text-white"
          title="Home"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <LanguageToggle />
      </div>

      <div className="absolute inset-0 z-0 hero-bg hero-glow" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-12 min-h-screen py-12">
        
        {/* Left Side - Text & Features */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 leading-tight text-slate-900 dark:text-white transition-colors">
            {t("Login_Your_Complete")}
          </h1>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-10 text-primary">
            {t("Login_ECommerce_Solution")}
          </h2>

          <div className="space-y-6">
            {[
              { icon: Building2, label: t("Login_Store_Management") },
              { icon: ClipboardList, label: t("Login_File_Management") },
              { icon: Wrench, label: t("Login_Vendor_Management") },
              { icon: Users, label: t("Login_Secure_Transactions") },
              { icon: Shield, label: t("Login_Reports_Analytics") },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-lg font-semibold text-slate-800 dark:text-white transition-colors">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="w-full lg:w-[480px] flex flex-col items-center mt-12 lg:mt-0">
          <div className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-8 sm:p-10 border border-white/50 dark:border-white/10 transition-colors duration-300">
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BrandMark className="h-12 w-12" />
                <span className="text-2xl font-black text-slate-900 dark:text-white">PMMS</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t("Login_Sign_In")}</h3>
              <p className="text-sm text-slate-600 dark:text-gray-300 transition-colors">{t("Login_Credentials_Desc")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1.5 transition-colors">
                    {t("Login_Email_Label")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder={t("Login_Email_Placeholder")}
                    {...register("email", {
                      required: t("Login_Email_Required"),
                      pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-md"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1.5 transition-colors">
                    {t("Login_Password_Label")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("Login_Password_Placeholder")}
                      {...register("password", {
                        required: t("Login_Password_Required"),
                        minLength: { value: 6, message: t("Login_Password_Min") }
                      })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-400 focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-md pr-11"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white focus:outline-none transition-colors"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-hover !text-white rounded-xl shadow-lg shadow-primary/25 transition-all mt-6">
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    {t("Login_Signing_In")}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t("Login_Sign_In_Btn")}
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-slate-600 dark:text-gray-300 transition-colors">{t("Login_Need_Help")} </span>
              <a href="#" className="font-semibold text-primary hover:text-primary-hover dark:hover:text-white transition-colors">
                {t("Login_Contact_Support")}
              </a>
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-white/50 transition-colors">
            {t("Login_Copyright", { year: new Date().getFullYear() })}
          </div>
        </div>

      </div>
    </div>
  );
}
