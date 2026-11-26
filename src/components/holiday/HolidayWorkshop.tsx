'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HolidayWorkshopCanvas } from '@/components/holiday/HolidayWorkshopCanvas';
import { HolidayGiftReveal } from '@/components/holiday/HolidayGiftReveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getCookieConsent } from '@/lib/legal/cookie-consent';
import { LOGO_MARK } from '@/lib/brand/logos';
import {
  HOLIDAY_WORKSHOP_TARGET,
  isHolidayWorkshopSeason,
  localDayKey,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import {
  dismissHolidayNotice,
  readTodaysHolidayClaim,
  saveHolidayClaim,
  wasHolidayNoticeDismissedRecently,
  type StoredHolidayClaim,
} from '@/lib/holiday/workshop-storage';
import './holiday-workshop.css';

type Overlay = 'closed' | 'playing' | 'reward';

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return (
    /\/products\/customize\//.test(pathname) ||
    /\/designs\/[^/]+\/customize(?:\/|$)/.test(pathname) ||
    /\/checkout(?:\/|$)/.test(pathname) ||
    /\/cart(?:\/|$)/.test(pathname) ||
    /\/account(?:\/|$)/.test(pathname) ||
    /\/rewards(?:\/|$)/.test(pathname)
  );
}

function isEntryPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return true;
  if (pathname === '/products' || pathname.startsWith('/products/')) return true;
  if (pathname === '/services' || pathname.startsWith('/services/')) return true;
  return false;
}

export function HolidayWorkshop() {
  const t = useTranslations('holidayWorkshop');
  const locale = useLocale();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('closed');
  const [claim, setClaim] = useState<StoredHolidayClaim | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [collectedKinds, setCollectedKinds] = useState<HolidayProductKind[]>([]);
  const claimingLock = useRef(false);

  const excluded = isExcludedPath(pathname);
  const entry = isEntryPath(pathname);

  const snowflakes = useMemo(
    () =>
      Array.from({ length: reducedMotion ? 8 : 22 }, (_, index) => ({
        id: index,
        left: `${(index * 17 + 9) % 100}%`,
        size: 6 + (index % 5) * 2,
        delay: `${(index * 0.37) % 6}s`,
        duration: `${10 + (index % 7)}s`,
        logo: index % 8 === 0,
      })),
    [reducedMotion],
  );

  useEffect(() => {
    if (!isHolidayWorkshopSeason() || excluded || !entry) {
      setNotice(false);
      return;
    }

    const existing = readTodaysHolidayClaim();
    if (existing) setClaim(existing);

    const cookieReady = getCookieConsent() !== null;
    const dismissed = wasHolidayNoticeDismissedRecently();
    if (dismissed) {
      setNotice(false);
      setReady(true);
      return;
    }

    const delay = cookieReady ? 1400 : 4200;
    const timer = window.setTimeout(() => {
      setNotice(true);
      setReady(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [entry, excluded]);

  const closeOverlay = useCallback(() => {
    setOverlay('closed');
    setNotice(false);
    dismissHolidayNotice();
  }, []);

  useEffect(() => {
    if (overlay === 'closed') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeOverlay();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [closeOverlay, overlay]);

  const startGame = useCallback(() => {
    const existing = readTodaysHolidayClaim();
    if (existing) {
      setClaim(existing);
      setOverlay('reward');
      setNotice(false);
      return;
    }
    setClaim(null);
    setClaimError(null);
    setPlayKey((value) => value + 1);
    setOverlay('playing');
    setNotice(false);
  }, []);

  const claimReward = useCallback(
    async (kinds: HolidayProductKind[]) => {
      const existing = readTodaysHolidayClaim();
      if (existing) {
        setClaim(existing);
        setOverlay('reward');
        return;
      }

      if (claimingLock.current) return;
      claimingLock.current = true;
      setClaiming(true);
      setClaimError(null);
      setOverlay('reward');
      try {
        const response = await fetch('/api/holiday-workshop/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collected: HOLIDAY_WORKSHOP_TARGET,
            collectedKinds: kinds.slice(-10),
            locale: locale === 'en' ? 'en' : 'mk',
            website: '',
          }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          prizeKey?: StoredHolidayClaim['prizeKey'];
          couponCode?: string;
          minOrderAmount?: number;
          discountAmount?: number;
          percent?: number | null;
          validDays?: number;
          golden?: boolean;
          suggestionId?: HolidayProductKind;
          suggestionHref?: string;
          code?: string;
        };

        if (!response.ok || !data.ok || !data.couponCode || !data.prizeKey) {
          setClaimError(t('claimError'));
          return;
        }

        const stored: StoredHolidayClaim = {
          day: localDayKey(),
          prizeKey: data.prizeKey,
          couponCode: data.couponCode,
          minOrderAmount: Number(data.minOrderAmount ?? 0),
          discountAmount: Number(data.discountAmount ?? 0),
          percent: data.percent ?? null,
          validDays: Number(data.validDays ?? 21),
          golden: Boolean(data.golden),
          suggestionId: data.suggestionId ?? 'mug',
          suggestionHref: data.suggestionHref ?? '/products',
          claimedAt: Date.now(),
        };
        saveHolidayClaim(stored);
        setClaim(stored);
      } catch {
        setClaimError(t('claimError'));
      } finally {
        claimingLock.current = false;
        setClaiming(false);
      }
    },
    [locale, t],
  );

  function onCollected(kinds: HolidayProductKind[]) {
    setCollectedKinds(kinds);
    void claimReward(kinds);
  }

  if (!isHolidayWorkshopSeason() || excluded) return null;

  return (
    <div className="hw-root">
      {notice && overlay === 'closed' ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[42] flex justify-end p-3 sm:p-5">
          <aside
            className="pointer-events-auto relative w-full max-w-[22.5rem] overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(160deg,rgba(28,80,130,0.92),rgba(62,64,141,0.94))] p-4 text-white shadow-[0_18px_50px_rgba(8,16,40,0.38)] backdrop-blur-xl"
            role="dialog"
            aria-labelledby="holiday-notice-title"
            data-testid="holiday-notice"
          >
            {!reducedMotion ? (
              <span
                className="hw-notice-float pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#f0d78c]/20 blur-2xl"
                aria-hidden
              />
            ) : null}
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl">
                🎁
              </span>
              <div className="min-w-0 flex-1">
                <p id="holiday-notice-title" className="font-display text-base font-bold leading-snug">
                  {claim ? t('noticeTitleClaimed') : t('noticeTitle')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {claim ? t('noticeBodyClaimed') : t('noticeBody')}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  dismissHolidayNotice();
                  setNotice(false);
                }}
                aria-label={t('dismiss')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="min-h-10 flex-1"
                onClick={startGame}
                data-testid="holiday-start"
              >
                <Gift className="mr-2 h-4 w-4" />
                {claim ? t('viewGift') : t('startCta')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-white"
                onClick={() => {
                  dismissHolidayNotice();
                  setNotice(false);
                }}
              >
                {t('later')}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      {overlay !== 'closed' ? (
        <div
          className="fixed inset-0 z-[55] overflow-hidden bg-[#071225]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="holiday-workshop-title"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(62,64,141,0.55), transparent 58%), radial-gradient(circle at 15% 80%, rgba(28,80,130,0.45), transparent 42%), linear-gradient(180deg, #0b1c3a 0%, #1c5082 48%, #3e408d 100%)',
            }}
          />
          <div className="hw-snowfall" aria-hidden>
            {snowflakes.map((flake) =>
              flake.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={flake.id}
                  src={LOGO_MARK}
                  alt=""
                  className="hw-snowflake hw-snowflake--logo"
                  style={{
                    left: flake.left,
                    width: flake.size + 10,
                    height: flake.size + 10,
                    animationDelay: flake.delay,
                    animationDuration: flake.duration,
                  }}
                />
              ) : (
                <span
                  key={flake.id}
                  className="hw-snowflake"
                  style={{
                    left: flake.left,
                    fontSize: flake.size,
                    animationDelay: flake.delay,
                    animationDuration: flake.duration,
                  }}
                >
                  ❄
                </span>
              ),
            )}
          </div>
          <span className="hw-star absolute left-[12%] top-[18%] h-1.5 w-1.5 rounded-full bg-white" />
          <span className="hw-star absolute right-[18%] top-[12%] h-1 w-1 rounded-full bg-[#f0d78c]" style={{ animationDelay: '1s' }} />
          <span className="hw-star absolute right-[28%] top-[28%] h-1.5 w-1.5 rounded-full bg-white" style={{ animationDelay: '1.8s' }} />

          <div className="relative flex h-full min-h-0 flex-col">
            {overlay === 'playing' ? (
              <HolidayWorkshopCanvas
                key={playKey}
                reducedMotion={reducedMotion}
                onComplete={onCollected}
                onClose={closeOverlay}
                onRetry={() => setPlayKey((value) => value + 1)}
              />
            ) : (
              <HolidayGiftReveal
                claim={claim}
                reducedMotion={reducedMotion}
                claiming={claiming}
                claimError={claimError}
                onRetryClaim={() => void claimReward(collectedKinds)}
                onClose={closeOverlay}
              />
            )}
          </div>
        </div>
      ) : null}

      {ready && claim && overlay === 'closed' && !notice && entry ? (
        <button
          type="button"
          onClick={startGame}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[41] flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-[#1c5082] to-[#3e408d] text-lg text-white shadow-lg sm:right-5"
          aria-label={t('viewGift')}
        >
          🎁
        </button>
      ) : null}
    </div>
  );
}
