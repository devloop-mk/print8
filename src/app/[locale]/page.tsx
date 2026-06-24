import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Sparkles, Palette, Truck, Printer, Shirt, Layers } from 'lucide-react';
import { getFeaturedServices, designTemplates, products } from '@/lib/data/catalog';
import { HomeShowcaseCarousel } from '@/components/home/HomeShowcaseCarousel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HeroIllustration } from '@/components/home/HeroIllustration';
import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { HomeHighlights } from '@/components/home/HomeHighlights';
import { FeaturedDesignCards } from '@/components/home/FeaturedDesignCards';
import { HomeContactCta } from '@/components/home/HomeContactCta';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Reveal } from '@/components/motion/Reveal';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations('home');

  const featuredServices = getFeaturedServices().slice(0, 8);
  const featuredDesigns = designTemplates;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
        <HeroBackdrop />
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-800 via-ink-900 to-ink-950 bg-[length:200%_200%] animate-gradient-shift"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-mesh-dark opacity-70"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-grid-light bg-grid opacity-[0.15]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:flex lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="lg:flex-1">
            <p className="eyebrow-on-dark mb-5">{t('heroBadge')}</p>
            <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:mt-6 sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-9">
              <Link href="/products">
                <Button
                  size="lg"
                  className="border-white bg-white text-brand-900 shadow-lift-lg hover:bg-brand-50"
                >
                  {t('heroCta')}
                </Button>
              </Link>
              <Link href="/designs">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
                >
                  {t('heroSecondary')}
                </Button>
              </Link>
            </div>
          </div>
          <div className="-mt-1 flex justify-center sm:mt-4 lg:mt-0 lg:flex-1 lg:justify-end">
            <HeroIllustration className="h-auto w-full max-w-[min(100%,17rem)] animate-float drop-shadow-2xl sm:max-w-xs md:max-w-md" />
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-ink-950/50 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
            {[
              { icon: Shirt, label: t('heroStatProducts') },
              { icon: Layers, label: t('heroStatDesigns') },
              { icon: Printer, label: t('heroStatServices') },
              { icon: Truck, label: t('heroStatDelivery') },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-ink-950/80 px-4 py-4 sm:px-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-400/40 bg-brand-600/20 text-brand-200">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-100 sm:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeHighlights />

      <HomeShowcaseCarousel />

      <Reveal delay={40}>
        <section className="section-band py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={t('featuredServices')}
                description={t('featuredServicesDesc')}
              />
              <Link href="/services" className="link-cta shrink-0">
                {t('viewAll')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} variant="home" />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={t('featuredProducts')}
                description={t('featuredProductsDesc')}
              />
              <Link href="/products" className="link-cta shrink-0">
                {t('viewAll')} →
              </Link>
            </div>
            <ProductCardGrid items={products} />
            <div className="mt-10 flex justify-center">
              <Link href="/products" className="link-cta">
                {t('viewAllProducts')} →
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="section-band-muted py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={t('featuredDesigns')}
                description={t('featuredDesignsDesc')}
              />
              <Link href="/designs" className="link-cta shrink-0">
                {t('viewAll')} →
              </Link>
            </div>
            <FeaturedDesignCards designs={featuredDesigns} />
          </div>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader className="mb-10" title={t('whyUs')} />
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-brand-300 bg-brand-50 text-brand-700">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">{t('whyQuality')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('whyQualityDesc')}</p>
              </Card>
              <Card>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-brand-300 bg-brand-50 text-brand-700">
                  <Palette className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">{t('whyCustom')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('whyCustomDesc')}</p>
              </Card>
              <Card>
                <div className="mb-4 flex h-12 w-12 items-center justify-center border border-brand-300 bg-brand-50 text-brand-700">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">{t('whyDelivery')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {t('whyDeliveryDesc')}
                </p>
              </Card>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={120}>
        <HomeContactCta />
      </Reveal>
    </>
  );
}
