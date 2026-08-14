export const LOCALE_STORAGE_KEY = "soouqlive-landing-lang";
export const LOCALE_COOKIE_KEY = "NEXT_LOCALE";
export const DEFAULT_LOCALE = "en";

export function normalizeLocale(value) {
  return value === "ar" ? "ar" : "en";
}

export function readStoredLocale() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (!stored) return null;
  return normalizeLocale(stored);
}

export function persistLocale(locale) {
  const normalized = normalizeLocale(locale);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  }

  document.cookie = `${LOCALE_COOKIE_KEY}=${normalized};path=/;max-age=31536000;SameSite=Lax`;

  return normalized;
}

export function applyLocaleToDocument(locale) {
  const normalized = normalizeLocale(locale);
  const isAr = normalized === "ar";
  const root = document.documentElement;
  const body = document.getElementById("body") || document.body;

  root.setAttribute("lang", isAr ? "ar" : "en");
  root.setAttribute("dir", isAr ? "rtl" : "ltr");
  root.classList.toggle("pref-lang-ar", isAr);
  root.classList.toggle("pref-lang-en", !isAr);
  body.classList.toggle("lang-ar", isAr);
  body.classList.toggle("lang-en", !isAr);
}
