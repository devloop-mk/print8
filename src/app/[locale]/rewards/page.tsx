import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/site';
import type { Locale } from '@/i18n/routing';
import { SpinWheelGame } from '@/components/rewards/SpinWheelGame';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'spinWheel' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('metaTitle')} | Print 8`,
    description: t('metaDescription'),
    path: '/rewards',
    // Static, spin-wheel-themed OG image — never the dynamic /api/og route.
    image: absoluteUrl('/og/rewards.jpg'),
  });
}

export default async function RewardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('spinWheel');

  return (
    <div className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-ink-50">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(47,124,178,0.22), transparent 62%), radial-gradient(circle at 18% 12%, rgba(232,93,4,0.16), transparent 42%), radial-gradient(circle at 86% 8%, rgba(47,124,178,0.14), transparent 40%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e85d04]">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="relative mt-10">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(520px,90vw)] w-[min(520px,90vw)] -translate-x-1/2 -translate-y-[42%] bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0%,rgba(47,124,178,0.08)_42%,transparent_70%)]"
            aria-hidden
          />
          <div className="relative">
            <SpinWheelGame />
          </div>
        </div>
      </div>
    </div>
  );
}
