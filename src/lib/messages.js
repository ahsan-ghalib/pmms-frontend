import { normalizeLocale } from "@/lib/locale-utils";

export async function loadMessages(locale) {
  const normalized = normalizeLocale(locale);
  const [base, pmms] = await Promise.all([
    import(`@/locales/${normalized}.json`).then((mod) => mod.default),
    import(`@/locales/pmms-${normalized}.json`).then((mod) => mod.default),
  ]);

  return {
    ...base,
    common: {
      ...base.common,
      ...pmms,
    },
    pmms,
  };
}
