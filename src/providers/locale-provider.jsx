"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  applyLocaleToDocument,
  persistLocale,
  readStoredLocale,
  normalizeLocale,
} from "@/lib/locale-utils";
import { loadMessages } from "@/lib/messages";

const LocaleContext = createContext({
  locale: "en",
  setLocale: () => {},
  dir: "ltr",
});

export function useLocaleContext() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children, initialLocale, initialMessages }) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedInitialLocale = normalizeLocale(initialLocale);
  const [locale, setLocaleState] = useState(resolvedInitialLocale);
  const [messages, setMessages] = useState(initialMessages);
  const hasMountedRef = useRef(false);
  const localeRef = useRef(resolvedInitialLocale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const setLocale = useCallback(async (newLocale) => {
    const normalized = normalizeLocale(newLocale);
    const newMessages = await loadMessages(normalized);

    persistLocale(normalized);
    setMessages(newMessages);
    setLocaleState(normalized);
    localeRef.current = normalized;
    applyLocaleToDocument(normalized);

    return normalized;
  }, []);

  const syncStoredLocale = useCallback(async () => {
    const stored = readStoredLocale();
    if (!stored || stored === localeRef.current) {
      return;
    }

    await setLocale(stored);
  }, [setLocale]);

  // Sync client state when server props change (e.g. after router.refresh)
  useEffect(() => {
    const normalized = normalizeLocale(initialLocale);
    setLocaleState(normalized);
    setMessages(initialMessages);
    localeRef.current = normalized;

    if (hasMountedRef.current) {
      applyLocaleToDocument(normalized);
    }
  }, [initialLocale, initialMessages]);

  // One-time mount: align cookie/localStorage with saved preference
  useEffect(() => {
    hasMountedRef.current = true;

    const stored = readStoredLocale();

    if (!stored) {
      persistLocale(resolvedInitialLocale);
      applyLocaleToDocument(resolvedInitialLocale);
      return;
    }

    if (stored !== resolvedInitialLocale) {
      void setLocale(stored).then(() => router.refresh());
      return;
    }

    persistLocale(resolvedInitialLocale);
    applyLocaleToDocument(resolvedInitialLocale);
  }, [resolvedInitialLocale, router, setLocale]);

  // Re-sync when navigating between pages (e.g. home -> dashboard)
  useEffect(() => {
    if (!hasMountedRef.current) {
      return;
    }

    void syncStoredLocale();
  }, [pathname, syncStoredLocale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      <NextIntlClientProvider
        key={locale}
        locale={locale}
        messages={messages}
        onError={(error) => {
          if (error.code === "MISSING_MESSAGE") return;
          console.error(error);
        }}
        getMessageFallback={({ key, namespace }) => (
          namespace ? `${namespace}.${key}` : key
        )}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
