import { getTranslations } from "next-intl/server";
import { services } from "@/lib/data/catalog";
import { ServiceCard } from "@/components/services/ServiceCard";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("services");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} variant="list" />
        ))}
      </div>
    </div>
  );
}
