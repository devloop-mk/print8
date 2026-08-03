import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  getResolvedServices,
  resolveCmsTexts,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { HeroSectionBackground } from '@/components/home/HeroSectionBackground';
import { Button } from '@/components/ui/Button';
import {
  ServicesHeroCarousel,
  type ServicesHeroCarouselItem,
} from '@/components/services/ServicesHeroCarousel';
import {
  getServicesHeroSlideHref,
  servicesHeroSlides,
} from '@/lib/services/services-hero-slides';

export async function ServicesPageHero({ locale }: { locale: CmsLocale }) {
  const t = await getTranslations('services');
  const ts = await getTranslations('services.items');

  const [cmsTexts, resolvedServices] = await Promise.all([
    resolveCmsTexts(
      [
        { key: 'services.heroBadge', fallback: t('heroBadge') },
        { key: 'services.heroTitle', fallback: t('heroTitle') },
        { key: 'services.heroSubtitle', fallback: t('heroSubtitle') },
      ],
      locale,
    ),
    getResolvedServices(locale, (id) => ({
      title: ts(`${id}.title`),
      description: ts(`${id}.description`),
    })),
  ]);

  const serviceMap = new Map(
    resolvedServices.map((service) => [service.id, service]),
  );

  const carouselItems: ServicesHeroCarouselItem[] = servicesHeroSlides
    .filter((slide) => serviceMap.has(slide.serviceId))
    .map((slide) => {
      const service = serviceMap.get(slide.serviceId)!;
      const title = service.title ?? ts(`${slide.serviceId}.title`);

      return {
        id: slide.serviceId,
        title,
        href: getServicesHeroSlideHref(slide.serviceId),
        image: slide.image,
        accent: slide.accent,
        imageFit: slide.imageFit,
      };
    });

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-950 text-white">
      <HeroSectionBackground />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-center lg:gap-10 lg:px-8 lg:py-10">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <p className="eyebrow-on-dark mb-3">{cmsTexts['services.heroBadge']}</p>
          <h1 className="max-w-xl font-display text-2xl font-bold leading-[1.15] tracking-tight sm:text-3xl lg:text-[2.15rem]">
            {cmsTexts['services.heroTitle']}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-100 sm:text-base">
            {cmsTexts['services.heroSubtitle']}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
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

        {carouselItems.length > 0 ? (
          <div className="order-1 w-full max-w-sm self-center lg:order-2 lg:max-w-xs lg:shrink-0 xl:max-w-sm">
            <ServicesHeroCarousel
              items={carouselItems}
              className="h-auto w-full"
              compact
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
