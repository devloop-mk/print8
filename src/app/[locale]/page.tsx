import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getPublishedDesignTemplates } from '@/lib/catalog/design-catalog';
import {
  getContactCmsValues,
  getResolvedFeaturedServices,
  resolveCmsTexts,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { getHomeTrendingProductDesigns } from '@/lib/cms/home-trending';
import { getHomeShowcaseByCategory } from '@/lib/home/featured-home-products';
import { TrendingDesignsSection } from '@/components/home/TrendingDesignsSection';
import { HomeShowcaseCarousel } from '@/components/home/HomeShowcaseCarousel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HomePromoBannerCarousel } from '@/components/home/HomePromoBannerCarousel';
import { HeroFeatureBar } from '@/components/home/HeroFeatureBar';
import { HomeHighlights } from '@/components/home/HomeHighlights';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeProductShowcase } from '@/components/home/HomeProductShowcase';
import { FeaturedDesignCards } from '@/components/home/FeaturedDesignCards';
import { HomeCustomDesignCta } from '@/components/home/HomeCustomDesignCta';
import { HomeContactCta } from '@/components/home/HomeContactCta';
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

  const [
    cmsTexts,
    contactCms,
    featuredServices,
    featuredDesigns,
    trendingDesigns,
    productShowcase,
  ] = await Promise.all([
      resolveCmsTexts(
        [
          { key: 'home.heroTitle', fallback: t('heroTitle') },
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
      getHomeShowcaseByCategory(),
    ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-200 bg-ink-950 text-white">
        <h1 className="sr-only">{cmsTexts['home.heroTitle']}</h1>
        <HomePromoBannerCarousel />
        <HeroFeatureBar />
      </section>

      <Reveal delay={20}>
        <HomeProductShowcase groups={productShowcase} />
      </Reveal>

      <Reveal delay={30}>
        <TrendingDesignsSection designs={trendingDesigns} />
      </Reveal>

      <HomeHighlights />

      <HomeHowItWorks />

      <Reveal delay={40}>
        <HomeShowcaseCarousel />
      </Reveal>

      <Reveal delay={50}>
        <section className="section-band py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={t('featuredServices')}
                description={t('featuredServicesDesc')}
              />
              <Link href="/services" className="link-cta shrink-0">
                {t('viewAll')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredServices.slice(0, 4).map((service) => (
                <ServiceCard key={service.id} service={service} variant="home" />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <section className="section-band-muted py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
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

      <Reveal delay={70}>
        <HomeCustomDesignCta />
      </Reveal>

      <Reveal delay={80}>
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
