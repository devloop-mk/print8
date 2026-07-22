import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsHubCatalog } from "@/components/products/ProductsHubCatalog";
import { ProductsHubRedirects } from "@/components/products/ProductsHubRedirects";
import { SectionLoading } from "@/components/ui/SectionLoading";
import { PageIntro } from "@/components/brand/PageIntro";
import { buildSectionMetadata } from "@/lib/seo/page-metadata";
import { getProductDisplayOrderRecord } from "@/lib/cms/display-order";
import type { Locale } from "@/i18n/routing";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: "metadata" });
  return buildSectionMetadata(locale as Locale, "/products", "products", tm("badges.products"));
}

export default async function ProductsPage() {
  const t = await getTranslations("products");
  const displayOrder = await getProductDisplayOrderRecord();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t("title")} subtitle={t("subtitle")} />
      <Suspense fallback={<SectionLoading />}>
        <ProductsHubRedirects />
        <ProductsHubCatalog displayOrder={displayOrder} />
      </Suspense>
    </div>
  );
}
