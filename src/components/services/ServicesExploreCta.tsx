import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, Palette, Shirt } from 'lucide-react';

export async function ServicesExploreCta() {
  const t = await getTranslations('services');

  return (
    <section className="mt-16">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-ink-50 p-6 shadow-sm sm:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t('ctaTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
            {t('ctaDesc')}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/products">
              <Button size="lg" className="h-full w-full gap-2 whitespace-nowrap px-5">
                <Shirt className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('ctaProducts')}
              </Button>
            </Link>
            <Link href="/designs">
              <Button size="lg" variant="secondary" className="h-full w-full gap-2 whitespace-nowrap px-5">
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('ctaDesigns')}
              </Button>
            </Link>
            <Link href="/designs/create">
              <Button size="lg" variant="outline" className="h-full w-full gap-2 whitespace-nowrap px-5">
                <Palette className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('ctaStudio')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
