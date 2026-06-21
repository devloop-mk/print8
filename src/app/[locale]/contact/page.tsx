import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactPageContent } from "@/components/contact/ContactPageContent";
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
  return buildSectionMetadata(locale as Locale, "/contact", "contact", tm("badges.contact"));
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t("title")} subtitle={t("subtitle")} centered />
      <ContactPageContent />
    </div>
  );
}
