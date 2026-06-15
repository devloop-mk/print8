import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
  Sparkles,
  Palette,
  Truck,
} from 'lucide-react';
import { services, designTemplates, products } from '@/lib/data/catalog';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HeroIllustration } from '@/components/home/HeroIllustration';

const iconMap = {
  CreditCard,
  BookOpen,
  Layers,
  Printer,
  Shield,
  Shirt,
  Coffee,
  ShoppingBag,
  BookMarked,
  Heart,
  PartyPopper,
  Gift,
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const ts = await getTranslations('services.items');
  const td = await getTranslations('designs');
  const tp = await getTranslations('products');

  const featuredServices = services.slice(0, 6);
  const featuredDesigns = designTemplates.slice(0, 4);
  const featuredProducts = products.slice(0, 4);

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

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink-900">
            {t('featuredServices')}
          </h2>
          <Link
            href="/services"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('viewAll')} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap];
            return (
              <Card
                key={service.id}
                className="group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-ink-900">
                  {ts(`${service.id}.title`)}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">
                  {ts(`${service.id}.description`)}
                </p>
                <p className="mt-4 text-sm font-medium text-brand-600">
                  {formatPrice(service.startingPrice, locale)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink-900">
            {t('featuredDesigns')}
          </h2>
          <Link
            href="/designs"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('viewAll')} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredDesigns.map((design) => (
            <Link
              key={design.id}
              href={`/designs/${design.id}`}
            >
              <Card className="overflow-hidden p-0">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center">
                  {design.image ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={design.image}
                        alt={td(`categories.${design.category}`) || design.id}
                        fill
                        sizes="320px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Palette className="h-12 w-12 text-ink-400" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-ink-900">
                    {td(`categories.${design.category}`)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-ink-900">
              {t('featuredProducts')}
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t('viewAll')} →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
              >
                <Card className="overflow-hidden p-0">
                  <div className="relative aspect-square bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={tp(`types.${product.type}`)}
                        fill
                        sizes="256px"
                        className="object-contain"
                      />
                    ) : (
                      <Shirt className="h-16 w-16 text-brand-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-ink-900">
                      {tp(`types.${product.type}`)}
                    </p>
                    <p className="text-sm text-brand-600">
                      {formatPrice(product.basePrice, locale)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
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
    </>
  );
}
