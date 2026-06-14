import { getTranslations } from "next-intl/server";
import { ContactPageContent } from "@/components/contact/ContactPageContent";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-500">{t("subtitle")}</p>
      </div>
      <ContactPageContent />
    </div>
  );
}
