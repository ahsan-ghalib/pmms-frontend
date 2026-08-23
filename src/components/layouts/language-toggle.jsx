"use client";

import { Globe } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocaleContext } from "@/providers/locale-provider";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export function LanguageToggle() {
  const { locale, setLocale } = useLocaleContext();
  const { update } = useSession();
  const router = useRouter();

  const toggleLang = async () => {
    const newLang = locale === "ar" ? "en" : "ar";
    await setLocale(newLang);
    try {
      await axiosInstance.put("/user/profile", { language: newLang });
      await update({ language: newLang });
    } catch {
      // Cookie/local preference still applies if the user is not signed in.
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      className="glass-btn flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <Globe className="size-4 text-violet-600" aria-hidden="true" />
      <span>{locale === "ar" ? "English" : "عربي"}</span>
    </button>
  );
}
