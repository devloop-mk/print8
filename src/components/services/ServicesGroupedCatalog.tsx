import { getTranslations } from 'next-intl/server';
import { getServicesByCategory } from '@/lib/data/catalog';
import { ServiceCard } from '@/components/services/ServiceCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export async function ServicesGroupedCatalog() {
  const t = await getTranslations('services');
  const grouped = getServicesByCategory();

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
