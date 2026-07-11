import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { FooterGate } from "@/components/layout/FooterGate";
import { CartProvider } from "@/components/cart/CartProvider";
import { OngoingDesignsProvider } from "@/components/drafts/OngoingDesignsProvider";
import { SiteAnalytics } from "@/components/analytics/SiteAnalytics";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { PageTransition } from "@/components/motion/PageTransition";
import { buildPageMetadata, buildOgImageUrl } from "@/lib/seo/metadata";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} flex min-h-dvh min-w-0 flex-col font-sans antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <OngoingDesignsProvider>
            <NavigationProgress />
            <SiteAnalytics />
            <CookieConsent />
            <Header />
            <main className="flex min-h-0 min-w-0 flex-1 flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
            <FooterGate />
            </OngoingDesignsProvider>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
