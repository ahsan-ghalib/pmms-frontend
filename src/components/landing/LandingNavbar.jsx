"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocaleContext } from "@/providers/locale-provider";
import BrandMark from "./BrandMark";

export default function LandingNavbar() {
  const { data: session } = useSession();
  const { locale, setLocale } = useLocaleContext();
  const [isDark, setIsDark] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("soouqlive-landing-color-mode");
    const currentTheme = storedTheme === "light" ? "light" : "dark";
    setIsDark(currentTheme === "dark");

    document.documentElement.setAttribute("data-brand", "purple");
    document.documentElement.setAttribute("data-accent", "purple");
    document.documentElement.setAttribute("data-color-mode", currentTheme);
    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-color-mode", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("soouqlive-landing-color-mode", newTheme);
  };

  const toggleLang = async () => {
    const newLang = locale === "ar" ? "en" : "ar";
    await setLocale(newLang);
  };

  const links = [
    { href: "/#features", ar: "المميزات", en: "Features" },
    { href: "/#how", ar: "كيف يعمل", en: "How it works" },
    { href: "/#roles", ar: "الأدوار", en: "Roles" },
  ];

  return (
    <nav className="nav-blur navbar-blur fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <span className="text-lg font-bold t-heading">PMMS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="t-nav-link">
              <span className="ar">{link.ar}</span>
              <span className="en">{link.en}</span>
            </Link>
          ))}
          {session ? (
            <Link href="/dashboard" className="t-nav-link">
              <span className="ar">لوحة التحكم</span>
              <span className="en">Dashboard</span>
            </Link>
          ) : (
            <Link href="/login" className="t-nav-link">
              <span className="ar">تسجيل الدخول</span>
              <span className="en">Sign in</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <circle cx="12" cy="12" r="4" />
                <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="ar">{isDark ? "فاتح" : "داكن"}</span>
            <span className="en">{isDark ? "Light" : "Dark"}</span>
          </button>
          <button type="button" onClick={toggleLang} className="theme-toggle-btn">
            <span className="ar">EN</span>
            <span className="en">عربي</span>
          </button>
          <Link
            href={session ? "/dashboard" : "/login"}
            className="hidden md:block btn-primary text-white text-sm font-semibold px-5 py-2 rounded-full"
          >
            <span className="ar">{session ? "افتح المنصة" : "دخول المنصة"}</span>
            <span className="en">{session ? "Open workspace" : "Enter workspace"}</span>
          </Link>
          <button
            type="button"
            className="md:hidden theme-toggle-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="t-nav-link" onClick={() => setOpen(false)}>
              <span className="ar">{link.ar}</span>
              <span className="en">{link.en}</span>
            </Link>
          ))}
          <Link
            href={session ? "/dashboard" : "/login"}
            className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full text-center"
            onClick={() => setOpen(false)}
          >
            <span className="ar">{session ? "افتح المنصة" : "تسجيل الدخول"}</span>
            <span className="en">{session ? "Open workspace" : "Sign in"}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
