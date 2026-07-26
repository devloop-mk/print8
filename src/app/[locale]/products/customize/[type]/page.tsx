import { getTranslations } from "next-intl/server";
import { ProductCustomizer } from "@/components/products/ProductCustomizer";
import { MagnetOrderForm } from "@/components/products/MagnetOrderForm";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LocalePageLoading } from "@/components/ui/LocalePageLoading";
import type { ProductType } from "@/lib/data/catalog";
import { notFound } from "next/navigation";
import { productTypes } from "@/lib/data/catalog";
import { buildProductCustomizeMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  if (!productTypes.includes(type as ProductType)) notFound();
  return buildProductCustomizeMetadata(locale as Locale, type as ProductType);
}

export default async function CustomizeProductPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { type } = await params;
  const t = await getTranslations("products.customizer");
  const tm = await getTranslations("products.magnetOrder");

  if (!productTypes.includes(type as ProductType)) {
    notFound();
  }

  const isMagnet = type === "magnet";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<LocalePageLoading />}>
        {isMagnet ? (
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h1 className="mb-6 text-2xl font-bold text-ink-900">
              {tm("title")}
            </h1>
            <MagnetOrderForm />
          </div>
        ) : (
          <ProductCustomizer type={type as ProductType} />
        )}
      </Suspense>
    </div>
  );
}
