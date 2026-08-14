"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/layouts/language-toggle";
import { useLandingAuthTheme } from "@/hooks/use-landing-auth-theme";
import "@/app/landing-theme.css";

export default function RegisterGateway() {
  const t = useTranslations("messages");
  const { theme, toggleTheme } = useLandingAuthTheme();

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

      <div className="w-full max-w-6xl mt-12 mb-8 z-10 relative">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/images/logo.png"
              alt="SoouqLive"
              width={160}
              height={64}
              className="h-16 mx-auto object-contain drop-shadow-xl"
            />
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--t-heading)]">
            {t("join_us") === "messages.join_us" ? "Join Us" : t("join_us")}
          </h1>
          <p className="text-[var(--t-text-muted)] text-lg">
            {t("start_journey") === "messages.start_journey" ? "Start your journey with us" : t("start_journey")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Customer Card */}
          <Link
            href="/register/customer"
            className="glass-card p-8 md:p-12 text-center group hover-glow transition-all duration-300 transform hover:-translate-y-2"
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              style={{
                background: "var(--t-accent-soft)",
                border: "1px solid var(--t-accent-border)",
              }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "var(--t-accent-2)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--t-heading)] group-hover:gradient-text transition-all duration-300">
              {t("i_am_customer") === "messages.i_am_customer" ? "I am a Customer" : t("i_am_customer")}
            </h2>
            <p className="text-[var(--t-text-muted)] mb-8">
              {t("customer_desc") === "messages.customer_desc" ? "Discover amazing products and enjoy seamless shopping." : t("customer_desc")}
            </p>
            <span className="inline-flex items-center text-[var(--t-accent)] font-semibold group-hover:text-[var(--t-accent-2)] transition-colors duration-300">
              {t("customer_registration") === "messages.customer_registration" ? "Customer Registration" : t("customer_registration")}
              <svg
                className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </span>
          </Link>

          {/* Vendor Card */}
          <Link
            href="/register/vendor"
            className="glass-card p-8 md:p-12 text-center group hover-glow transition-all duration-300 transform hover:-translate-y-2"
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              style={{
                background: "var(--t-accent-soft)",
                border: "1px solid var(--t-accent-border)",
              }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "var(--t-accent-2)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--t-heading)] group-hover:gradient-text transition-all duration-300">
              {t("i_am_vendor") === "messages.i_am_vendor" ? "I am a Vendor" : t("i_am_vendor")}
            </h2>
            <p className="text-[var(--t-text-muted)] mb-8">
              {t("vendor_desc") === "messages.vendor_desc" ? "Start selling your products and grow your business." : t("vendor_desc")}
            </p>
            <span className="inline-flex items-center text-[var(--t-accent)] font-semibold group-hover:text-[var(--t-accent-2)] transition-colors duration-300">
              {t("vendor_registration") === "messages.vendor_registration" ? "Vendor Registration" : t("vendor_registration")}
              <svg
                className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </span>
          </Link>

          {/* Driver Card */}
          <Link
            href="/register/driver"
            className="glass-card p-8 md:p-12 text-center group hover-glow transition-all duration-300 transform hover:-translate-y-2"
          >
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
              style={{
                background: "var(--t-accent-soft)",
                border: "1px solid var(--t-accent-border)",
              }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "var(--t-accent-2)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4v11m9 0h2m-2 0H9m4 0h2m0 0h4V9h-4m0 7V9m0 0h-2"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--t-heading)] group-hover:gradient-text transition-all duration-300">
              {t("i_am_driver") === "messages.i_am_driver" ? "I am a Driver" : t("i_am_driver")}
            </h2>
            <p className="text-[var(--t-text-muted)] mb-8">
              {t("driver_desc") === "messages.driver_desc" ? "Deliver orders, manage trips, and earn with SoouqLive." : t("driver_desc")}
            </p>
            <span className="inline-flex items-center text-[var(--t-accent)] font-semibold group-hover:text-[var(--t-accent-2)] transition-colors duration-300">
              {t("driver_registration") === "messages.driver_registration" ? "Driver Registration" : t("driver_registration")}
              <svg
                className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </span>
          </Link>
        </div>

        <div className="text-center mt-12 text-[var(--t-text-muted)]">
          {t("already_have_account") === "messages.already_have_account" ? "Already have an account?" : t("already_have_account")}{" "}
          <Link
            href="/login"
            className="text-[var(--t-accent)] hover:text-[var(--t-accent-2)] transition-colors font-semibold"
          >
            {t("login_here") === "messages.login_here" ? "Login here" : t("login_here")}
          </Link>
        </div>
      </div>
    </div>
  );
}
