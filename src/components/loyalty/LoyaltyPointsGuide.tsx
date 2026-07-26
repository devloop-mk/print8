import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FIRST_ORDER_BONUS_POINTS,
  LOYALTY_POINT_MKDISCOUNT_VALUE,
  LOYALTY_POINTS_PER_100_MKD,
} from '@/lib/loyalty/constants';
import { calculateEarnedPoints, pointsToDiscountMkd } from '@/lib/loyalty/points';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';

const sectionKeys = ['earn', 'pending', 'redeem'] as const;
const stepKeys = ['account', 'shop', 'checkout', 'delivery'] as const;
const faqKeys = ['guest', 'pending', 'expire', 'combine'] as const;

const sectionImages: Record<(typeof sectionKeys)[number], string> = {
  earn: '/loyalty/earn-points.svg',
  pending: '/loyalty/pending-delivery.svg',
  redeem: '/loyalty/redeem-checkout.svg',
};

const EXAMPLE_ORDER_MKD = 1000;
const EXAMPLE_POINTS_FOR_DISCOUNT = 400;

export async function LoyaltyPointsGuide() {
  const t = await getTranslations('loyaltyPoints');

  const exampleEarned = calculateEarnedPoints(EXAMPLE_ORDER_MKD);
  const exampleTotal = exampleEarned + FIRST_ORDER_BONUS_POINTS;
  const exampleDiscount = pointsToDiscountMkd(EXAMPLE_POINTS_FOR_DISCOUNT);

  return (
    <div className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-ink-50">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(47,124,178,0.22), transparent 62%), radial-gradient(circle at 18% 12%, rgba(232,93,4,0.16), transparent 42%), radial-gradient(circle at 86% 8%, rgba(47,124,178,0.14), transparent 40%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e85d04]">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl lg:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600 lg:mx-0 lg:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/account/register">
                <Button className="gap-2">
                  {t('ctaRegister')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/account/login">
                <Button variant="outline">{t('ctaLogin')}</Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle,rgba(255,255,255,0.6)_0%,rgba(47,124,178,0.1)_45%,transparent_72%)]"
              aria-hidden
            />
            <Image
              src="/loyalty/hero-points.svg"
              alt=""
              width={480}
              height={360}
              className="mx-auto w-full max-w-sm drop-shadow-lg lg:max-w-md"
              priority
            />
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card className="border-brand-200 bg-white/90 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              {t('stats.earnLabel')}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-950">
              {t('stats.earnValue', { points: LOYALTY_POINTS_PER_100_MKD })}
            </p>
            <p className="mt-1 text-sm text-ink-600">{t('stats.earnHint')}</p>
          </Card>
          <Card className="border-brand-200 bg-white/90 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              {t('stats.valueLabel')}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-950">
              {t('stats.valueAmount', { value: LOYALTY_POINT_MKDISCOUNT_VALUE })}
            </p>
            <p className="mt-1 text-sm text-ink-600">{t('stats.valueHint')}</p>
          </Card>
          <Card className="border-[#e85d04]/30 bg-gradient-to-br from-[#fff8f0] to-white p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c24d03]">
              {t('stats.bonusLabel')}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-brand-950">
              {t('stats.bonusValue', { points: FIRST_ORDER_BONUS_POINTS })}
            </p>
            <p className="mt-1 text-sm text-ink-600">{t('stats.bonusHint')}</p>
          </Card>
        </div>

        <section className="mt-16">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('pillarsTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
              {t('pillarsSubtitle')}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {sectionKeys.map((key) => (
              <Card
                key={key}
                className="flex flex-col overflow-hidden border-ink-200/80 p-0"
              >
                <div className="bg-gradient-to-b from-brand-50/80 to-white px-4 pt-4">
                  <Image
                    src={sectionImages[key]}
                    alt=""
                    width={320}
                    height={240}
                    className="mx-auto h-auto w-full max-w-[280px]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold text-ink-900">
                    {t(`pillars.${key}.title`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                    {t(`pillars.${key}.body`)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('stepsTitle')}
            </h2>
            <p className="mt-2 text-sm text-ink-600 sm:text-base">{t('stepsSubtitle')}</p>
          </div>

          <ol className="mt-8 space-y-4">
            {stepKeys.map((key, index) => (
              <li key={key}>
                <Card className="flex gap-4 p-5 sm:items-start sm:gap-6">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink-900">
                      {t(`steps.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {t(`steps.${key}.body`)}
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 via-white to-[#fff8f0] p-0">
            <div className="grid lg:grid-cols-2">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-brand-700">
                  <Sparkles className="h-5 w-5" aria-hidden />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {t('example.eyebrow')}
                  </p>
                </div>
                <h2 className="mt-3 font-display text-2xl font-bold text-ink-900">
                  {t('example.title')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {t('example.intro')}
                </p>

                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start justify-between gap-4 rounded-lg border border-ink-200/80 bg-white/80 px-4 py-3">
                    <span className="text-ink-600">{t('example.orderLine')}</span>
                    <span className="font-semibold text-ink-900">
                      {EXAMPLE_ORDER_MKD} MKD
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-4 rounded-lg border border-ink-200/80 bg-white/80 px-4 py-3">
                    <span className="text-ink-600">
                      {t('example.earnLine', {
                        points: LOYALTY_POINTS_PER_100_MKD,
                      })}
                    </span>
                    <span className="font-semibold text-brand-700">
                      +{exampleEarned} pts
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-4 rounded-lg border border-[#e85d04]/25 bg-[#fff8f0]/80 px-4 py-3">
                    <span className="flex items-center gap-2 text-ink-600">
                      <Gift className="h-4 w-4 shrink-0 text-[#e85d04]" aria-hidden />
                      {t('example.bonusLine')}
                    </span>
                    <span className="font-semibold text-[#c24d03]">
                      +{FIRST_ORDER_BONUS_POINTS} pts
                    </span>
                  </li>
                  <li className="flex items-start justify-between gap-4 rounded-lg border-2 border-brand-300 bg-brand-50/60 px-4 py-3">
                    <span className="font-medium text-brand-900">
                      {t('example.totalLine')}
                    </span>
                    <span className="font-display text-lg font-bold text-brand-900">
                      {exampleTotal} pts
                    </span>
                  </li>
                </ul>

                <p className="mt-6 text-sm leading-relaxed text-ink-600">
                  {t('example.redeemNote', {
                    points: EXAMPLE_POINTS_FOR_DISCOUNT,
                    amount: exampleDiscount,
                  })}
                </p>
              </div>

              <div className="flex flex-col justify-center border-t border-brand-200/60 bg-white/50 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  {t('example.redeemTitle')}
                </p>
                <p className="mt-3 font-display text-4xl font-bold text-brand-950">
                  {EXAMPLE_POINTS_FOR_DISCOUNT} pts
                </p>
                <p className="mt-1 text-lg font-semibold text-[#c24d03]">
                  −{exampleDiscount} MKD
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-600">
                  {t('example.redeemBody', {
                    value: LOYALTY_POINT_MKDISCOUNT_VALUE,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            {t('faqTitle')}
          </h2>
          <div className="mt-6 space-y-3">
            {faqKeys.map((key) => (
              <Card key={key} className="p-5">
                <h3 className="font-semibold text-ink-900">
                  {t(`faq.${key}.q`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {t(`faq.${key}.a`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <Card className="border-ink-200 bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
              {t('alsoTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">
              {t('alsoBody')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/rewards">
                <Button variant="outline" className="gap-2">
                  {t('alsoSpin')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/how-to-order">
                <Button variant="outline">{t('alsoHowToOrder')}</Button>
              </Link>
            </div>
          </Card>
        </section>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/products">
            <Button>{t('ctaProducts')}</Button>
          </Link>
          <Link href="/account">
            <Button variant="outline">{t('ctaAccount')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
