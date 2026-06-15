import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Sparkles, Palette, Truck } from 'lucide-react';
import { services, designTemplates, products } from '@/lib/data/catalog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HeroIllustration } from '@/components/home/HeroIllustration';
import { FeaturedDesignCards } from '@/components/home/FeaturedDesignCards';
import { HomeContactCta } from '@/components/home/HomeContactCta';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { ServiceCard } from '@/components/services/ServiceCard';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations('home');

  const featuredServices = services.slice(0, 4);
  const personalizedDesigns = designTemplates.filter(
    (design) => design.kind === 'customizable',
  );

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="lg:flex-1">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-100">
              {t('heroBadge')}
            </p>
            <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services">
                <Button
                  size="lg"
                  className="bg-white text-brand-800 hover:bg-brand-50"
                >
                  {t('heroCta')}
                </Button>
              </Link>
              <Link href="/designs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/60 text-white bg-transparent hover:bg-white/10"
                >
                  {t('heroSecondary')}
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-12 flex justify-center lg:mt-0 lg:flex-1 lg:justify-end">
            <HeroIllustration className="h-auto w-full max-w-md drop-shadow-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-ink-900">
              {t('featuredServices')}
            </h2>
            <p className="mt-2 text-ink-500">{t('featuredServicesDesc')}</p>
          </div>
          <Link
            href="/services"
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('viewAll')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {featuredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              variant="home"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-ink-900">
            {t('featuredDesigns')}
          </h2>
          <p className="mt-2 text-ink-500">{t('featuredDesignsDesc')}</p>
        </div>
        <FeaturedDesignCards designs={personalizedDesigns} />
      </section>

      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-ink-900">
                {t('featuredProducts')}
              </h2>
              <p className="mt-2 text-ink-500">{t('featuredProductsDesc')}</p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t('viewAll')} →
            </Link>
          </div>
          <ProductCardGrid items={products} />
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-2xl font-bold text-ink-900">
            {t('whyUs')}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <Sparkles className="mb-4 h-8 w-8 text-brand-600" />
              <h3 className="font-semibold text-ink-900">{t('whyQuality')}</h3>
              <p className="mt-2 text-sm text-ink-500">{t('whyQualityDesc')}</p>
            </Card>
            <Card>
              <Palette className="mb-4 h-8 w-8 text-brand-600" />
              <h3 className="font-semibold text-ink-900">{t('whyCustom')}</h3>
              <p className="mt-2 text-sm text-ink-500">{t('whyCustomDesc')}</p>
            </Card>
            <Card>
              <Truck className="mb-4 h-8 w-8 text-brand-600" />
              <h3 className="font-semibold text-ink-900">{t('whyDelivery')}</h3>
              <p className="mt-2 text-sm text-ink-500">
                {t('whyDeliveryDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      <HomeContactCta />
    </>
  );
}
