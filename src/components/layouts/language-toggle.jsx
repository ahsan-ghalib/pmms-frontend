"use client";

import { Globe } from "lucide-react";
import { useLocaleContext } from "@/providers/locale-provider";
import { useRouter } from "next/navigation";

export function LanguageToggle() {
  const { locale, setLocale } = useLocaleContext();
  const router = useRouter();

  const toggleLang = async () => {
    const newLang = locale === "ar" ? "en" : "ar";
    await setLocale(newLang);
    router.refresh();
  };

  return (
    <button
      onClick={toggleLang}
      className="glass-btn flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <Globe className="size-4 text-violet-600" />
      <span>{locale === "ar" ? "English" : "عربي"}</span>
    </button>
  );
}
