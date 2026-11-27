'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { RewardModal } from '@/components/scratch/RewardModal';
import { Button } from '@/components/ui/Button';
import { getCookieConsent } from '@/lib/legal/cookie-consent';
import {
  canAutoShowPromo,
  markDailyPromoPlayed,
  onDailyPromoPlayed,
} from '@/lib/promo/daily-promo';
import { SPIN_PENDING_COUPON_KEY } from '@/lib/rewards/spin-config';
import {
  NY_SCRATCH_CELL_COUNT,
  getNyScratchPrize,
  hasRevealedWinningTriple,
  isNyScratchPrizeKey,
  isNyScratchSeason,
  isValidNyScratchGrid,
  winningGridIndices,
  type NyScratchPrizeKey,
} from '@/lib/scratch/scratch-config';
import {
  dismissNyScratch,
  isNyScratchPlayComplete,
  readNyScratchClaim,
  saveNyScratchClaim,
  wasNyScratchDismissedRecently,
  type StoredNyScratchClaim,
} from '@/lib/scratch/scratch-storage';

function emptyRevealed(): boolean[] {
  return Array.from({ length: NY_SCRATCH_CELL_COUNT }, () => false);
}

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return (
    pathname === '/catalog' ||
    pathname.startsWith('/catalog/') ||
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
  if (pathname === '/products' || pathname.startsWith('/products/')) return true;
  if (pathname === '/services' || pathname.startsWith('/services/')) return true;
  return false;
}

export function NewYearScratch() {
  const t = useTranslations('newYearScratch');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { items, hydrated } = useCart();
  const [open, setOpen] = useState(false);
  const [intro, setIntro] = useState(false);
  const [ready, setReady] = useState(false);
  const [claim, setClaim] = useState<StoredNyScratchClaim | null>(null);
  const [grid, setGrid] = useState<NyScratchPrizeKey[] | null>(null);
  const [revealedCells, setRevealedCells] = useState<boolean[]>(emptyRevealed);
  const [won, setWon] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [boardKey, setBoardKey] = useState(0);
  const inFlight = useRef<Promise<StoredNyScratchClaim | null> | null>(null);
  const pendingReveals = useRef<Set<number>>(new Set());

  const excluded = isExcludedPath(pathname);
  const entry = isEntryPath(pathname);

  const applyClaim = useCallback((stored: StoredNyScratchClaim, complete: boolean) => {
    setClaim(stored);
    if (stored.grid && isValidNyScratchGrid(stored.grid, stored.prizeKey)) {
      setGrid(stored.grid);
    } else {
      setGrid(null);
    }
    setWon(complete);
    if (complete) {
      setRevealedCells(emptyRevealed());
    }
  }, []);

  useEffect(() => {
    if (!isNyScratchSeason() || excluded) {
      setOpen(false);
      return;
    }

    const existing = readNyScratchClaim();
    if (existing) {
      applyClaim(existing, isNyScratchPlayComplete(existing));
      setReady(true);
      return;
    }

    if (!entry) {
      setReady(true);
      return;
    }

    if (wasNyScratchDismissedRecently()) {
      setReady(true);
      return;
    }

    if (!canAutoShowPromo('scratch')) {
      setReady(true);
      return;
    }

    const delay = getCookieConsent() !== null ? 1600 : 4200;
    const timer = window.setTimeout(() => {
      setIntro(true);
      setReady(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [applyClaim, entry, excluded]);

  useEffect(() => {
    return onDailyPromoPlayed((id) => {
      if (id !== 'scratch') setIntro(false);
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setIntro(false);
    dismissNyScratch();
  }, []);

  const markWon = useCallback((stored: StoredNyScratchClaim) => {
    const complete: StoredNyScratchClaim = { ...stored, playComplete: true };
    saveNyScratchClaim(complete);
    setClaim(complete);
    setWon(true);
  }, []);

  const startGame = useCallback(async (): Promise<StoredNyScratchClaim | null> => {
    if (claim?.couponCode) return claim;
    const existing = readNyScratchClaim();
    if (existing) {
      applyClaim(existing, isNyScratchPlayComplete(existing));
      return existing;
    }
    if (inFlight.current) return inFlight.current;
    setClaiming(true);
    setClaimError(null);

    const request = (async (): Promise<StoredNyScratchClaim | null> => {
      try {
        const response = await fetch('/api/new-year-scratch/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale: locale === 'en' ? 'en' : 'mk',
            website: '',
          }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          grid?: unknown;
          couponCode?: string | null;
          prizeKey?: string;
          percent?: number | null;
          discountAmount?: number;
          minOrderAmount?: number;
          jackpot?: boolean;
          href?: string;
          endsAt?: string | null;
        };

        if (!response.ok || !data.ok || !data.couponCode || !data.prizeKey) {
          setClaimError(t('claimError'));
          return null;
        }
        if (!isNyScratchPrizeKey(data.prizeKey)) {
          setClaimError(t('claimError'));
          return null;
        }
        if (!isValidNyScratchGrid(data.grid, data.prizeKey)) {
          setClaimError(t('claimError'));
          return null;
        }

        const prizeKey: NyScratchPrizeKey = data.prizeKey;
        const prize = getNyScratchPrize(prizeKey);
        const stored: StoredNyScratchClaim = {
          claimedAt: Date.now(),
          couponCode: data.couponCode,
          prizeKey,
          percent: data.percent ?? prize.percent,
          discountAmount: Number(data.discountAmount ?? prize.discountAmount),
          minOrderAmount: Number(data.minOrderAmount ?? prize.minOrderAmount),
          jackpot: Boolean(data.jackpot ?? prize.jackpot),
          href: data.href ?? prize.href,
          endsAt: data.endsAt ?? null,
          grid: data.grid,
          playComplete: false,
        };
        saveNyScratchClaim(stored);
        markDailyPromoPlayed('scratch');
        setClaim(stored);
        setGrid(data.grid);
        return stored;
      } catch {
        setClaimError(t('claimError'));
        return null;
      } finally {
        setClaiming(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = request;
    return request;
  }, [applyClaim, claim, locale, t]);

  const revealCells = useCallback((indices: Iterable<number>) => {
    setRevealedCells((prev) => {
      const next = [...prev];
      let changed = false;
      const apply = (index: number) => {
        if (index < 0 || index >= NY_SCRATCH_CELL_COUNT) return;
        if (next[index]) return;
        next[index] = true;
        changed = true;
      };
      for (const index of pendingReveals.current) apply(index);
      pendingReveals.current.clear();
      for (const index of indices) apply(index);
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (won || !claim || !grid) return;
    if (!hasRevealedWinningTriple(grid, revealedCells, claim.prizeKey)) return;
    markWon(claim);
  }, [claim, grid, markWon, revealedCells, won]);

  const onCellReveal = useCallback(
    async (index: number) => {
      if (won) return;
      pendingReveals.current.add(index);
      const stored = claim ?? (await startGame());
      if (!stored) return;
      revealCells([index]);
    },
    [claim, revealCells, startGame, won],
  );

  const onRevealWinning = useCallback(async () => {
    if (won) return;
    const stored = claim ?? (await startGame());
    if (!stored?.grid) return;
    revealCells(winningGridIndices(stored.grid, stored.prizeKey));
  }, [claim, revealCells, startGame, won]);

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

  function useDiscount() {
    if (!claim?.couponCode) return;
    try {
      sessionStorage.setItem(
        SPIN_PENDING_COUPON_KEY,
        JSON.stringify({ code: claim.couponCode }),
      );
    } catch {
      /* ignore */
    }
    close();
    const destination =
      hydrated && items.length === 0 ? '/products' : claim.href || '/checkout';
    router.push(destination);
  }

  if (!isNyScratchSeason() || excluded) return null;

  return (
    <>
      {intro && !open ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[42] flex justify-end p-3 sm:p-5">
          <aside
            className="pointer-events-auto relative w-full max-w-[22.5rem] rounded-2xl border border-white/20 bg-[linear-gradient(160deg,rgba(28,80,130,0.92),rgba(62,64,141,0.94))] p-4 text-white shadow-[0_18px_50px_rgba(8,16,40,0.38)] backdrop-blur-xl"
            role="dialog"
            aria-labelledby="ny-scratch-intro-title"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl">
                🎄
              </span>
              <div className="min-w-0 flex-1">
                <p
                  id="ny-scratch-intro-title"
                  className="font-display text-base font-bold leading-snug"
                >
                  {t('introTitle')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/75">
                  {t('introBody')}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
                onClick={close}
                aria-label={t('close')}
              >
                ×
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                className="min-h-10 flex-1"
                onClick={() => {
                  setIntro(false);
                  setOpen(true);
                }}
              >
                {t('start')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-white"
                onClick={close}
              >
                {t('later')}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
      <RewardModal
        open={open}
        claim={claim}
        grid={grid}
        boardKey={boardKey}
        revealedCells={revealedCells}
        won={won}
        claiming={claiming}
        claimError={claimError}
        copied={copied}
        onScratchStart={() => {
          void startGame();
        }}
        onCellReveal={(index) => {
          void onCellReveal(index);
        }}
        onRevealWinning={() => {
          void onRevealWinning();
        }}
        onCopy={() => void copyCode()}
        onUse={useDiscount}
        onClose={close}
        onRetry={() => {
          setClaimError(null);
          setRevealedCells(emptyRevealed());
          pendingReveals.current.clear();
          inFlight.current = null;
          setBoardKey((key) => key + 1);
          void startGame();
        }}
      />
      {ready && claim && !open && entry ? (
        <button
          type="button"
          onClick={() => {
            const complete = isNyScratchPlayComplete(claim);
            setWon(complete);
            if (!complete) setRevealedCells(emptyRevealed());
            setOpen(true);
          }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-[41] flex h-12 w-12 items-center justify-center rounded-full border border-[#fbbf24]/40 bg-gradient-to-br from-[#1c5082] to-[#3e408d] text-lg text-white shadow-lg sm:left-5"
          aria-label={t('reopen')}
        >
          🎄
        </button>
      ) : null}
    </>
  );
}
