import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";

const faqKeys = ["payment", "formats", "delivery", "custom", "minimum"] as const;

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
