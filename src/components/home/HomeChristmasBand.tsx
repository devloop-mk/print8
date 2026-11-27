import { getLocale, getTranslations } from 'next-intl/server';
import { Snowflake } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { getProductDesignDisplayName } from '@/lib/products/design-display-name';
import { getChristmasHomeShowcase } from '@/lib/products/christmas-designs';
import { PRODUCT_OFFERING_PATHS, buildDesignDetailUrl } from '@/lib/products/paths';

export async function HomeChristmasBand() {
  const locale = (await getLocale()) as 'mk' | 'en';
  const t = await getTranslations('home.christmas');
  const types = await getTranslations('products.types');
  const items = getChristmasHomeShowcase();
  if (items.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-b border-[#1a4a34] text-white"
      style={{
        background:
          'linear-gradient(165deg, #10281c 0%, #1a3d2b 46%, #3d1c22 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 20%, rgba(255,255,255,0.55) 0 1.5px, transparent 2px), radial-gradient(circle at 22% 72%, rgba(255,255,255,0.4) 0 1px, transparent 1.6px), radial-gradient(circle at 70% 18%, rgba(255,255,255,0.5) 0 1.5px, transparent 2px), radial-gradient(circle at 88% 64%, rgba(255,255,255,0.35) 0 1px, transparent 1.6px), radial-gradient(circle at 48% 40%, rgba(232,196,114,0.18) 0 80px, transparent 81px)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3d48a]">
              <Snowflake className="h-3.5 w-3.5" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              {t('description')}
            </p>
          </div>
          <Link
            href={PRODUCT_OFFERING_PATHS.christmasReadyDesigns}
            className="inline-flex shrink-0 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#143024] shadow-sm transition hover:bg-[#fff6e8]"
          >
            {t('viewAll')}
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map(({ design, product }) => {
            const name = getProductDesignDisplayName(design, locale);
            const type = design.productTypes[0];
            return (
              <li key={design.id}>
                <Link href={buildDesignDetailUrl(design.id)} className="group block">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/40 transition duration-300 group-hover:-translate-y-0.5">
                    <DesignTemplatePreview
                      product={product}
                      color={design.recommendedColor ?? '#ffffff'}
                      design={design}
                      typeLabel={name}
                      allowDrinkware3d={false}
                      mockupVariant="catalog-card"
                      className="rounded-none border-0 bg-white shadow-none"
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#f3d48a]">
                    {types(type)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-center text-xs font-medium text-white/90">
                    {name}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
