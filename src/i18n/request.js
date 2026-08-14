import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { LOCALE_COOKIE_KEY, normalizeLocale } from "@/lib/locale-utils";

export default getRequestConfig(async () => {
  noStore();
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
    timeZone: 'UTC',
  };
});
