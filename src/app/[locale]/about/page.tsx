import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";
import { AboutWebsiteSection } from "@/components/about/AboutWebsiteSection";
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
  return buildSectionMetadata(locale as Locale, "/about", "about", tm("badges.about"));
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t("title")} subtitle={t("subtitle")} centered />

      <div className="mx-auto max-w-3xl">
        <p className="text-lg leading-relaxed text-ink-600">{t("story")}</p>

        <AboutWebsiteSection />

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-ink-900">{t("mission")}</h2>
          <p className="mt-4 text-ink-600">{t("missionText")}</p>
        </div>

        <h2 className="mb-6 mt-12 text-2xl font-bold text-ink-900">{t("values")}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <Sparkles className="mb-3 h-8 w-8 text-brand-600" />
            <h3 className="font-semibold text-ink-900">{t("quality")}</h3>
            <p className="mt-2 text-sm text-ink-500">{t("qualityDesc")}</p>
          </Card>
          <Card>
            <Zap className="mb-3 h-8 w-8 text-brand-600" />
            <h3 className="font-semibold text-ink-900">{t("speed")}</h3>
            <p className="mt-2 text-sm text-ink-500">{t("speedDesc")}</p>
          </Card>
          <Card>
            <ShieldCheck className="mb-3 h-8 w-8 text-brand-600" />
            <h3 className="font-semibold text-ink-900">{t("trust")}</h3>
            <p className="mt-2 text-sm text-ink-500">{t("trustDesc")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
