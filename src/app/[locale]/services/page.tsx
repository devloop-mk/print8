import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { services } from "@/lib/data/catalog";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServicesExploreCta } from "@/components/services/ServicesExploreCta";
import { PageIntro } from "@/components/brand/PageIntro";
import { buildSectionMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

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
  await params;
  const t = await getTranslations("services");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t("title")} subtitle={t("subtitle")} centered />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} variant="list" />
        ))}
      </div>

      <ServicesExploreCta />
    </div>
  );
}
