import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Sparkles, Zap, ShieldCheck } from "lucide-react";

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-500">{t("subtitle")}</p>
      </div>

      <div className="mx-auto max-w-3xl">
        <p className="text-lg leading-relaxed text-ink-600">{t("story")}</p>

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
