import { getTranslations } from "next-intl/server";
import { DesignStudio } from "@/components/studio/DesignStudio";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LocalePageLoading } from "@/components/ui/LocalePageLoading";
import { buildSectionMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: "metadata" });
  return buildSectionMetadata(
    locale as Locale,
    "/designs/create",
    "studio",
    tm("badges.studio"),
  );
}

export default async function CreateDesignPage() {
  const t = await getTranslations("studio");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-lg text-ink-500">{t("subtitle")}</p>
      </div>
      <Suspense fallback={<LocalePageLoading />}>
        <DesignStudio />
      </Suspense>
    </div>
  );
}
