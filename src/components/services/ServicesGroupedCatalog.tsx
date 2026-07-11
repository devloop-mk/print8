import { getTranslations } from 'next-intl/server';
import {
  getResolvedServicesByCategory,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

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

  return (
    <div className="space-y-14">
      {grouped.map(({ category, services: categoryServices }) => (
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
    </div>
  );
}
