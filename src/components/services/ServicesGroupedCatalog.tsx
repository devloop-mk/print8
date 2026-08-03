import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  getResolvedServicesByCategory,
  type CmsLocale,
} from '@/lib/cms/public-content';
import type { ServiceCategoryId } from '@/lib/data/catalog';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Shirt } from 'lucide-react';

/** Shop-floor services shown in full on /services (not product catalog duplicates). */
const PRIMARY_SERVICE_CATEGORIES: ServiceCategoryId[] = [
  'print',
  'finishing',
];

export async function ServicesGroupedCatalog({
  locale,
}: {
  locale: CmsLocale;
}) {
  const t = await getTranslations('services');
  const ts = await getTranslations('services.items');
  const grouped = await getResolvedServicesByCategory(locale, (id) => ({
    title: ts(`${id}.title`),
    description: ts(`${id}.description`),
  }));

  const primary = grouped.filter(
    ({ category, services: categoryServices }) =>
      PRIMARY_SERVICE_CATEGORIES.includes(category) &&
      categoryServices.length > 0,
  );

  return (
    <div className="space-y-14">
      {primary.map(({ category, services: categoryServices }) => (
        <section key={category} id={category} className="scroll-mt-24">
          <SectionHeader
            className="mb-6"
            title={t(`categories.${category}.title`)}
            description={t(`categories.${category}.description`)}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categoryServices.map((service) => (
              <ServiceCard key={service.id} service={service} variant="list" />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-ink-200 bg-ink-50/70 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink-900 sm:text-xl">
              {t('productsTeaserTitle')}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600 sm:text-base">
              {t('productsTeaserDesc')}
            </p>
          </div>
          <Link href="/products" className="shrink-0">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Shirt className="h-4 w-4" aria-hidden="true" />
              {t('productsTeaserCta')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
