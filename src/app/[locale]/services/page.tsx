import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { services } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ServiceOrderButton } from "@/components/services/ServiceOrderButton";
import {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
} from "lucide-react";

const iconMap = {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
};

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("services");
  const ts = await getTranslations("services.items");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-ink-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = iconMap[service.icon as keyof typeof iconMap];
          return (
            <Card key={service.id} className="flex flex-col">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-ink-900">
                {ts(`${service.id}.title`)}
              </h2>
              <p className="mt-2 flex-1 text-sm text-ink-500">
                {ts(`${service.id}.description`)}
              </p>
              <p className="mt-4 text-sm font-medium text-brand-600">
                {t("startingFrom")} {formatPrice(service.startingPrice, locale)}
              </p>
              <div className="mt-4 flex gap-2">
                <ServiceOrderButton
                  serviceId={service.id}
                  name={ts(`${service.id}.title`)}
                  price={service.startingPrice}
                />
                <Link href="/designs/create">
                  <Button variant="outline" size="sm">
                    Studio
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
