import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Printer, Sparkles, Truck, Award } from 'lucide-react';
import {
  getResolvedFeaturedServices,
  resolveCmsTexts,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { HeroSectionBackground } from '@/components/home/HeroSectionBackground';
import { HeroFeatureBar } from '@/components/home/HeroFeatureBar';
import { Button } from '@/components/ui/Button';
import {
  ServicesHeroCarousel,
  type ServicesHeroCarouselItem,
} from '@/components/services/ServicesHeroCarousel';
import {
  getServicesHeroSlideHref,
  servicesHeroSlides,
} from '@/lib/services/services-hero-slides';
import { formatPrice } from '@/lib/utils';

export async function ServicesPageHero({ locale }: { locale: CmsLocale }) {
  const t = await getTranslations('services');
  const ts = await getTranslations('services.items');

  const [cmsTexts, featuredServices] = await Promise.all([
    resolveCmsTexts(
      [
        { key: 'services.heroBadge', fallback: t('heroBadge') },
        { key: 'services.heroTitle', fallback: t('heroTitle') },
        { key: 'services.heroSubtitle', fallback: t('heroSubtitle') },
      ],
      locale,
    ),
    getResolvedFeaturedServices(locale, (id) => ({
      title: ts(`${id}.title`),
      description: ts(`${id}.description`),
    })),
  ]);

  const featuredMap = new Map(
    featuredServices.map((service) => [service.id, service]),
  );

  const carouselItems: ServicesHeroCarouselItem[] = servicesHeroSlides
    .filter((slide) => featuredMap.has(slide.serviceId))
    .map((slide) => {
      const service = featuredMap.get(slide.serviceId)!;
      const title = service.title ?? ts(`${slide.serviceId}.title`);
      const priceLabel =
        service.startingPrice > 0
          ? `${t('startingFrom')} ${formatPrice(service.startingPrice, locale)}`
          : t('priceOnRequest');

      return {
        id: slide.serviceId,
        title,
        priceLabel,
        href: getServicesHeroSlideHref(slide.serviceId),
        image: slide.image,
        accent: slide.accent,
        imageFit: slide.imageFit,
      };
    });

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <HeroSectionBackground />

      <div className="relative mx-auto flex max-w-7xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1 lg:flex-1">
          <p className="eyebrow-on-dark mb-5">{cmsTexts['services.heroBadge']}</p>
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {cmsTexts['services.heroTitle']}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:mt-6 sm:text-lg">
            {cmsTexts['services.heroSubtitle']}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-9">
            <Link href="#services-catalog">
              <Button
                size="lg"
                className="border-white bg-white text-brand-900 shadow-lift-lg hover:bg-brand-50"
              >
                {t('heroCta')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                {t('contactUs')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="order-1 mb-8 flex w-full justify-center lg:order-2 lg:mb-0 lg:flex-1 lg:justify-end">
          <ServicesHeroCarousel
            items={carouselItems}
            className="h-auto w-full max-w-none lg:max-w-md xl:max-w-lg"
          />
        </div>
      </div>

      <HeroFeatureBar
        items={[
          { icon: Sparkles, label: t('heroStatQuality') },
          { icon: Printer, label: t('heroStatRange') },
          { icon: Award, label: t('heroStatPopular') },
          { icon: Truck, label: t('heroStatDelivery') },
        ]}
      />
    </section>
  );
}
