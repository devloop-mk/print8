import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { DesignsGallery } from "@/components/designs/DesignsGallery";
import { SectionLoading } from "@/components/ui/SectionLoading";
import { Button } from "@/components/ui/Button";
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
  return buildSectionMetadata(locale as Locale, "/designs", "designs", tm("badges.designs"));
}

export default async function DesignsPage() {
  const t = await getTranslations("designs");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t("title")} subtitle={t("subtitle")}>
        <div className="mt-6">
          <Link href="/designs/create">
            <Button size="lg" variant="outline">
              {t("createOwn")}
            </Button>
          </Link>
        </div>
      </PageIntro>
      <Suspense fallback={<SectionLoading />}>
        <DesignsGallery />
      </Suspense>
    </div>
  );
}
