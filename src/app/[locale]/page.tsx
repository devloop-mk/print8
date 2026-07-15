import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Sparkles, Palette, Truck, Printer, Shirt, Layers } from 'lucide-react';
import { getPublishedDesignTemplates } from '@/lib/catalog/design-catalog';
import {
  getContactCmsValues,
  getResolvedFeaturedServices,
  resolveCmsTexts,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { getHomeTrendingProductDesigns } from '@/lib/cms/home-trending';
import { TrendingDesignsSection } from '@/components/home/TrendingDesignsSection';
import { HomeShowcaseCarousel } from '@/components/home/HomeShowcaseCarousel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { HeroSectionBackground } from '@/components/home/HeroSectionBackground';
import { HeroFeatureBar } from '@/components/home/HeroFeatureBar';
import { HomeHighlights } from '@/components/home/HomeHighlights';
import { FeaturedDesignCards } from '@/components/home/FeaturedDesignCards';
import { HomeCustomDesignCta } from '@/components/home/HomeCustomDesignCta';
import { HomeContactCta } from '@/components/home/HomeContactCta';
import { FeaturedProductCategories } from '@/components/home/FeaturedProductCategories';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Reveal } from '@/components/motion/Reveal';

export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cmsLocale = locale as CmsLocale;
  const t = await getTranslations('home');
  const ts = await getTranslations('services.items');
  const tc = await getTranslations('contact');

  const [cmsTexts, contactCms, featuredServices, featuredDesigns, trendingDesigns] =
    await Promise.all([
    resolveCmsTexts(
      [
        { key: 'home.heroBadge', fallback: t('heroBadge') },
        { key: 'home.heroTitle', fallback: t('heroTitle') },
        { key: 'home.heroSubtitle', fallback: t('heroSubtitle') },
        { key: 'home.contactCtaBadge', fallback: t('contactCtaBadge') },
        { key: 'home.contactCtaTitle', fallback: t('contactCtaTitle') },
        { key: 'home.contactCtaDesc', fallback: t('contactCtaDesc') },
      ],
      cmsLocale,
    ),
    getContactCmsValues(cmsLocale, {
      phoneValue: tc('phoneValue'),
      emailValue: tc('emailValue'),
      addressValue: tc('addressValue'),
      hoursValue: tc('hoursValue'),
    }),
    getResolvedFeaturedServices(cmsLocale, (id) => ({
      title: ts(`${id}.title`),
      description: ts(`${id}.description`),
    })),
    getPublishedDesignTemplates(),
    getHomeTrendingProductDesigns(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
        <HeroSectionBackground />
        <div className="relative mx-auto flex max-w-7xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="order-2 lg:order-1 lg:flex-1">
            <p className="eyebrow-on-dark mb-5">{cmsTexts['home.heroBadge']}</p>
            <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {cmsTexts['home.heroTitle']}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:mt-6 sm:text-lg">
              {cmsTexts['home.heroSubtitle']}
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
          <div className="order-1 mb-8 flex w-full justify-center lg:order-2 lg:mb-0 lg:flex-1 lg:justify-end">
            <HeroCarousel className="h-auto w-full max-w-none lg:max-w-md xl:max-w-lg" />
          </div>
        </div>

        <HeroFeatureBar
          items={[
            { icon: Shirt, label: t('heroStatProducts') },
            { icon: Layers, label: t('heroStatDesigns') },
            { icon: Printer, label: t('heroStatServices') },
            { icon: Truck, label: t('heroStatDelivery') },
          ]}
        />
      </section>

      <HomeHighlights />

      <Reveal delay={20}>
        <TrendingDesignsSection designs={trendingDesigns} />
      </Reveal>

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
              {featuredServices.slice(0, 8).map((service) => (
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
            <FeaturedProductCategories />
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

      <Reveal delay={90}>
        <HomeCustomDesignCta />
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
        <HomeContactCta
          badge={cmsTexts['home.contactCtaBadge']}
          title={cmsTexts['home.contactCtaTitle']}
          description={cmsTexts['home.contactCtaDesc']}
          phoneValue={contactCms['contact.phoneValue']}
          emailValue={contactCms['contact.emailValue']}
          addressValue={contactCms['contact.addressValue']}
          hoursValue={contactCms['contact.hoursValue']}
        />
      </Reveal>
    </>
  );
}
