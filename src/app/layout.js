import { Inter, JetBrains_Mono, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import AuthProvider from "@/components/layouts/auth-provider";
import { Providers } from "@/components/layouts/toaster";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { LocaleProvider } from "@/providers/locale-provider";
import { LOCALE_COOKIE_KEY, normalizeLocale } from "@/lib/locale-utils";
import { loadMessages } from "@/lib/messages";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "PMMS | Property Maintenance Management",
  description:
    "PMMS is a bilingual property and facility maintenance platform for companies, supervisors, technicians, and tenants in Qatar and the GCC.",
  openGraph: {
    title: "PMMS | Property Maintenance Management",
    description:
      "Bilingual property and facility maintenance for companies, supervisors, technicians, and tenants — complaints, work orders, and preventive plans.",
    siteName: "PMMS",
    type: "website",
  },
  keywords: [
    "property maintenance",
    "facility management",
    "work orders",
    "complaints",
    "Qatar",
    "GCC",
    "PMMS",
  ],
  authors: [{ name: "PMMS" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const isAr = locale === "ar";
  const messages = await loadMessages(locale);

  return (
    <html
      lang={isAr ? "ar" : "en"}
      dir={isAr ? "rtl" : "ltr"}
      data-brand="purple"
      data-accent="purple"
      data-color-mode="light"
      className={isAr ? "pref-lang-ar" : "pref-lang-en"}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('soouqlive-landing-color-mode');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.setAttribute('data-color-mode', 'dark');
                  document.documentElement.classList.add('dark');
                } else if (theme === 'light') {
                  document.documentElement.setAttribute('data-color-mode', 'light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.setAttribute('data-color-mode', 'dark');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        id="body"
        className={`${inter.variable} ${jetbrainsMono.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground ${isAr ? "lang-ar" : "lang-en"}`}
        suppressHydrationWarning
      >
        <Providers>
          <ReduxProvider>
            <AuthProvider>
              <LocaleProvider initialLocale={locale} initialMessages={messages}>
                {children}
              </LocaleProvider>
            </AuthProvider>
          </ReduxProvider>
        </Providers>
      </body>
    </html>
  );
}
