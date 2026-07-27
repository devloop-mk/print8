'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { SpinWheelPreview } from '@/components/rewards/SpinWheelPreview';
import {
  SPIN_CLAIMED_FLAG_KEY,
  SPIN_PROMO_DISMISS_KEY,
  SPIN_PROMO_DISMISS_MS,
} from '@/lib/rewards/spin-config';

function isRewardsPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/rewards\/?$/.test(pathname);
}

function isCustomizerPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    /\/products\/customize\//.test(pathname) ||
    /\/designs\/[^/]+\/customize(?:\/|$)/.test(pathname)
  );
}

function isSpinPromoExcludedPath(pathname: string | null): boolean {
  return isRewardsPath(pathname) || isCustomizerPath(pathname);
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(SPIN_PROMO_DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < SPIN_PROMO_DISMISS_MS;
  } catch {
    return false;
  }
}

function hasClaimed(): boolean {
  try {
    return localStorage.getItem(SPIN_CLAIMED_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function SpinWheelPromoPopup() {
  const t = useTranslations('spinWheel.promo');
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isSpinPromoExcludedPath(pathname)) {
      setVisible(false);
      return;
    }

    if (wasDismissedRecently() || hasClaimed()) {
      return;
    }

    let armed = false;

    function onScroll() {
      if (armed) return;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = window.scrollY / maxScroll;
      if (progress < 0.5) return;

      armed = true;
      setVisible(true);
      window.removeEventListener('scroll', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  function dismiss() {
    try {
      localStorage.setItem(SPIN_PROMO_DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible || isSpinPromoExcludedPath(pathname)) return null;

  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center bg-ink-950/40 p-3 sm:p-6">
      <div
        className="relative w-full max-w-md border border-brand-200 bg-white p-5 shadow-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spin-promo-title"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 p-1.5 text-ink-500 hover:text-ink-800"
          aria-label={t('dismiss')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="mx-auto flex justify-center pt-1 sm:mx-0 sm:w-[168px] sm:shrink-0">
            <SpinWheelPreview size={168} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e85d04]">
              {t('eyebrow')}
            </p>
            <h2
              id="spin-promo-title"
              className="mt-2 pr-8 font-display text-2xl font-bold text-brand-950"
            >
              {t('title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('body')}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 max-sm:justify-between sm:flex-wrap sm:justify-start">
          <Link href="/rewards" onClick={dismiss} className="max-sm:order-2">
            <Button className="min-h-11 border-[#e85d04] bg-[#e85d04] px-5 hover:border-[#f48c06] hover:bg-[#f48c06]">
              {t('cta')}
            </Button>
          </Link>
          <Button
            type="button"
            variant="ghost"
            onClick={dismiss}
            className="max-sm:order-1"
          >
            {t('later')}
          </Button>
        </div>
      </div>
    </div>
  );
}
