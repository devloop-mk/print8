'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Copy, Gift, Share2 } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { HolidayProductGlyph } from '@/components/holiday/HolidayProductGlyph';
import { useCart } from '@/components/cart/CartProvider';
import { holidayBoostPercent } from '@/lib/holiday/holiday-discount';
import {
  HOLIDAY_PRODUCTS,
  type HolidayPrizeKey,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import { SPIN_PENDING_COUPON_KEY } from '@/lib/rewards/spin-config';
import { formatPrice } from '@/lib/utils';
import type { StoredHolidayClaim } from '@/lib/holiday/workshop-storage';

type RevealPhase = 'pause' | 'shake' | 'open' | 'reveal';

export function HolidayGiftReveal({
  claim,
  reducedMotion,
  claiming,
  claimError,
  onRetryClaim,
  onClose,
}: {
  claim: StoredHolidayClaim | null;
  reducedMotion: boolean;
  claiming: boolean;
  claimError: string | null;
  onRetryClaim: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('holidayWorkshop');
  const locale = useLocale();
  const router = useRouter();
  const cart = useCart();
  const [phase, setPhase] = useState<RevealPhase>(reducedMotion ? 'open' : 'pause');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      const id = window.setTimeout(() => setPhase('reveal'), 400);
      return () => window.clearTimeout(id);
    }

    const timers = [
      window.setTimeout(() => setPhase('shake'), 700),
      window.setTimeout(() => setPhase('open'), 2400),
      window.setTimeout(() => setPhase('reveal'), 3300),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reducedMotion]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        dx: `${(Math.random() - 0.5) * 280}px`,
        dy: `${-80 - Math.random() * 220}px`,
        rot: `${(Math.random() - 0.5) * 420}deg`,
        color: ['#f0d78c', '#ffffff', '#1c5082', '#3e408d', '#d4b56a'][index % 5],
        delay: `${index * 18}ms`,
      })),
    [],
  );

  const prizeKey: HolidayPrizeKey = claim?.prizeKey ?? 'percent10';
  const suggestionId: HolidayProductKind = claim?.suggestionId ?? 'mug';
  const suggestion = HOLIDAY_PRODUCTS.find((item) => item.id === suggestionId) ?? HOLIDAY_PRODUCTS[0];
  const productLabel = t(`products.${suggestionId}`);
  const boostPercent = claim?.percent ? holidayBoostPercent(claim.percent) : null;
  const cartTotal = cart?.total ?? 0;
  const canUseNow =
    Boolean(claim?.couponCode) &&
    cartTotal > 0 &&
    cartTotal + 1e-9 >= (claim?.minOrderAmount ?? 0);

  async function copyCode() {
    if (!claim?.couponCode) return;
    try {
      await navigator.clipboard.writeText(claim.couponCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareChallenge() {
    const shareUrl = window.location.origin;
    const payload = {
      title: t('shareTitle'),
      text: t('shareText'),
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(`${payload.text} ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function useNow() {
    if (!claim?.couponCode || !canUseNow) return;
    try {
      sessionStorage.setItem(
        SPIN_PENDING_COUPON_KEY,
        JSON.stringify({ code: claim.couponCode }),
      );
    } catch {
      /* ignore */
    }
    onClose();
    router.push('/checkout');
  }

  function goTo(href: string) {
    onClose();
    router.push(href);
  }

  const showBox = phase !== 'reveal' || claiming || Boolean(claimError);
  const boxOpen = phase === 'open' || phase === 'reveal';

  return (
    <div
      className="relative flex h-full min-h-0 flex-col items-center justify-center px-4 py-6 text-center"
      data-testid="holiday-gift-stage"
    >
      {phase === 'open' || phase === 'reveal' ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {confetti.map((bit) => (
            <span
              key={bit.id}
              className="hw-confetti-bit"
              style={{
                background: bit.color,
                animationDelay: bit.delay,
                ['--hw-dx' as string]: bit.dx,
                ['--hw-dy' as string]: bit.dy,
                ['--hw-rot' as string]: bit.rot,
              }}
            />
          ))}
        </div>
      ) : null}

      {showBox ? (
        <div className="relative">
          <div
            className={`hw-gift-glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,215,140,0.55),transparent_68%)] ${
              claim?.golden ? 'h-56 w-56' : ''
            }`}
            aria-hidden
          />
          <div
            className={`relative h-44 w-44 sm:h-52 sm:w-52 ${
              phase === 'shake' ? 'hw-gift-shake' : ''
            } ${boxOpen ? 'hw-gift-open' : ''}`}
          >
            <div className="hw-lid absolute left-[-6%] top-0 z-20 h-[34%] w-[112%] origin-bottom rounded-t-lg bg-gradient-to-br from-[#3e408d] to-[#1c5082] shadow-lg transition-transform duration-700 ease-out">
              <div className="absolute left-1/2 top-[-18%] h-10 w-16 -translate-x-1/2 rounded-full bg-[#f0d78c]" />
              <div className="absolute inset-x-[46%] top-0 h-full bg-[#f0d78c]" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[70%] overflow-hidden rounded-b-xl bg-gradient-to-br from-[#1c5082] to-[#3e408d] shadow-[0_20px_50px_rgba(8,16,40,0.45)]">
              <div className="absolute inset-y-0 left-[46%] w-[8%] bg-[#f0d78c]" />
              <div className="absolute inset-x-0 top-[38%] h-[10%] bg-[#f0d78c]" />
            </div>
          </div>
        </div>
      ) : null}

      {claiming && !claim ? (
        <p className="relative z-10 mt-8 max-w-sm text-sm text-white/80">{t('claiming')}</p>
      ) : null}

      {claimError && !claim ? (
        <div className="relative z-10 mt-8 max-w-sm">
          <p className="text-sm text-white/80">{claimError}</p>
          <Button type="button" className="mt-4" onClick={onRetryClaim}>
            {t('retryClaim')}
          </Button>
        </div>
      ) : null}

      <h2 id="holiday-workshop-title" className="sr-only">
        {t('gameTitle')}
      </h2>

      {phase === 'reveal' && claim ? (
        <div className="relative z-10 mt-6 w-full max-w-md animate-spin-win-pop rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl sm:p-7">
          {claim.golden ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0d78c]">
              {t('goldenBadge')}
            </p>
          ) : (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0d78c]">
              {t('rewardEyebrow')}
            </p>
          )}
          <h3
            className="mt-2 font-display text-2xl font-bold sm:text-3xl"
            data-testid="holiday-prize-title"
          >
            {t(`prizes.${prizeKey}.title`)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {t(`prizes.${prizeKey}.body`)}
          </p>

          <div className="mt-5 rounded-xl border border-white/15 bg-[#071225]/50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              {t('couponLabel')}
            </p>
            <p
              className="mt-1 font-display text-2xl font-bold tracking-[0.12em] text-[#f0d78c]"
              data-testid="holiday-coupon-code"
            >
              {claim.couponCode}
            </p>
            <p className="mt-2 text-xs text-white/60">
              {claim.percent
                ? claim.minOrderAmount > 0
                  ? t('couponRulesPercentBoostMin', {
                      percent: claim.percent,
                      boost: holidayBoostPercent(claim.percent),
                      product: productLabel,
                      min: formatPrice(claim.minOrderAmount, locale),
                      days: claim.validDays,
                    })
                  : t('couponRulesPercentBoost', {
                      percent: claim.percent,
                      boost: holidayBoostPercent(claim.percent),
                      product: productLabel,
                      days: claim.validDays,
                    })
                : claim.minOrderAmount > 0
                  ? t('couponRulesFixed', {
                      amount: formatPrice(claim.discountAmount, locale),
                      min: formatPrice(claim.minOrderAmount, locale),
                      days: claim.validDays,
                    })
                  : t('couponRulesNoMin', {
                      amount: formatPrice(claim.discountAmount, locale),
                      days: claim.validDays,
                    })}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => void copyCode()}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? t('copied') : t('copyCode')}
            </Button>
            {canUseNow ? (
              <Button type="button" variant="secondary" onClick={useNow}>
                {t('useNow')}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => goTo('/products')}>
                {t('shopCta')}
              </Button>
            )}
            <Button type="button" variant="ghost" className="text-white" onClick={() => void shareChallenge()}>
              <Share2 className="mr-2 h-4 w-4" />
              {t('shareCta')}
            </Button>
          </div>

          {boostPercent ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f0d78c]">
              {t('santaPick', { product: productLabel })}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              {t('santaPickBody', {
                product: productLabel,
                boost: boostPercent,
                base: claim.percent ?? 0,
              })}
            </p>
            <Link
              href={claim.suggestionHref || suggestion.href}
              className="mt-2 flex items-center gap-3 rounded-lg p-1 transition hover:bg-white/5"
              onClick={(event) => {
                event.preventDefault();
                goTo(claim.suggestionHref || suggestion.href);
              }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <HolidayProductGlyph kind={suggestionId} className="h-10 w-10" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">
                  {productLabel}
                </span>
                <span className="text-xs text-white/60">
                  {t('santaPickCta', { product: productLabel })}
                </span>
              </span>
              <Gift className="ml-auto h-4 w-4 text-[#f0d78c]" />
            </Link>
          </div>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/55 hover:text-white"
          >
            {t('close')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
