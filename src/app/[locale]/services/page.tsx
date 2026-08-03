import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ServicesGroupedCatalog } from "@/components/services/ServicesGroupedCatalog";
import { ServicesExploreCta } from "@/components/services/ServicesExploreCta";
import { ServicesPageHero } from "@/components/services/ServicesPageHero";
import { buildSectionMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";
import type { CmsLocale } from "@/lib/cms/public-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: "metadata" });
  return buildSectionMetadata(locale as Locale, "/services", "services", tm("badges.services"));
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cmsLocale = locale as CmsLocale;

  return (
    <>
      <ServicesPageHero locale={cmsLocale} />

      <div
        id="services-catalog"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
      >
        <ServicesGroupedCatalog locale={cmsLocale} />

        <ServicesExploreCta />
      </div>
    </>
  );
}
