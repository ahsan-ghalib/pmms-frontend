"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { persistLocale } from "@/lib/locale-utils";
import { useLocaleContext } from "@/providers/locale-provider";

export default function SessionLocaleSync() {
  const { data: session, status } = useSession();
  const { locale, setLocale } = useLocaleContext();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || appliedRef.current) return;
    const preferred = session?.user?.language;
    if (!preferred || preferred === locale) {
      appliedRef.current = true;
      return;
    }
    appliedRef.current = true;
    persistLocale(preferred);
    void setLocale(preferred);
  }, [locale, session?.user?.language, setLocale, status]);

  return null;
}
