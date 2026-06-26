import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { PageTransition } from "@/components/motion/PageTransition";
import { buildPageMetadata, buildOgImageUrl } from "@/lib/seo/metadata";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return buildPageMetadata({
    locale: locale as Locale,
    title: t("title"),
    description: t("description"),
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t("ogImageTitle"),
      description: t("ogImageDescription"),
      subtitle: t("ogImageSubtitle"),
      badge: t("ogImageBadge"),
    }),
  });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "mk" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <NavigationProgress />
            <SiteAnalytics />
            <CookieConsent />
            <Header />
            <main className="min-h-[calc(100vh-8rem)]">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
