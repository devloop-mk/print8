import { getTranslations } from "next-intl/server";
import { ProductCustomizer } from "@/components/products/ProductCustomizer";
import { PhotoUploadOrderForm } from "@/components/products/PhotoUploadOrderForm";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LocalePageLoading } from "@/components/ui/LocalePageLoading";
import type { ProductType } from "@/lib/data/catalog";
import { notFound } from "next/navigation";
import { productTypes } from "@/lib/data/catalog";
import { getVisibleProductTypes } from '@/lib/cms/product-visibility';
import { buildProductCustomizeMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";
import {
  isUploadOnlyProductType,
  type UploadOnlyProductType,
} from '@/lib/products/upload-only-products';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  if (!productTypes.includes(type as ProductType)) notFound();
  const visibleTypes = await getVisibleProductTypes();
  if (!visibleTypes.includes(type as ProductType)) notFound();
  return buildProductCustomizeMetadata(locale as Locale, type as ProductType);
}

export default async function CustomizeProductPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { type } = await params;
  const tu = await getTranslations("products.uploadOrder");

  if (!productTypes.includes(type as ProductType)) {
    notFound();
  }

  const visibleTypes = await getVisibleProductTypes();
  if (!visibleTypes.includes(type as ProductType)) {
    notFound();
  }

  const uploadType = isUploadOnlyProductType(type as ProductType)
    ? (type as UploadOnlyProductType)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Suspense fallback={<LocalePageLoading />}>
        {uploadType ? (
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h1 className="mb-6 text-2xl font-bold text-ink-900">
              {tu("title")}
            </h1>
            <PhotoUploadOrderForm productType={uploadType} />
          </div>
        ) : (
          <ProductCustomizer type={type as ProductType} />
        )}
      </Suspense>
    </div>
  );
}
