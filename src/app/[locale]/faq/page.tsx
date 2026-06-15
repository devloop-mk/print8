import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { buildSectionMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

const faqKeys = ["payment", "formats", "delivery", "custom", "minimum"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: "metadata" });
  return buildSectionMetadata(locale as Locale, "/faq", "faq", tm("badges.faq"));
}

export default async function FaqPage() {
  const t = await getTranslations("faq");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-12 text-center text-3xl font-bold text-ink-900">
        {t("title")}
      </h1>
      <div className="space-y-4">
        {faqKeys.map((key) => (
          <Card key={key}>
            <h2 className="font-semibold text-ink-900">{t(`items.${key}.q`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t(`items.${key}.a`)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
