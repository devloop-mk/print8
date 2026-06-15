import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { buildNoIndexMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildNoIndexMetadata(locale as Locale, "/checkout", "checkout");
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-lg text-ink-500">{t("subtitle")}</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
