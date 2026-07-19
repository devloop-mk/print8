'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import {
  SPIN_CLAIMED_FLAG_KEY,
  SPIN_PROMO_DISMISS_KEY,
  SPIN_PROMO_DISMISS_MS,
} from '@/lib/rewards/spin-config';

function isRewardsPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/rewards\/?$/.test(pathname);
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
    if (isRewardsPath(pathname) || wasDismissedRecently() || hasClaimed()) {
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

  if (!visible || isRewardsPath(pathname)) return null;

  return (
    <div className="fixed inset-0 z-[45] flex items-end justify-center bg-ink-950/40 p-3 sm:items-center sm:p-6">
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

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/rewards" onClick={dismiss}>
            <Button className="border-[#e85d04] bg-[#e85d04] hover:border-[#f48c06] hover:bg-[#f48c06]">
              {t('cta')}
            </Button>
          </Link>
          <Button type="button" variant="ghost" onClick={dismiss}>
            {t('later')}
          </Button>
        </div>
      </div>
    </div>
  );
}
