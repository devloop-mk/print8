'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, Gift, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScratchGrid } from '@/components/scratch/ScratchGrid';
import { ConfettiEffect } from '@/components/scratch/ConfettiEffect';
import type { StoredNyScratchClaim } from '@/lib/scratch/scratch-storage';
import {
  getNyScratchPrize,
  type NyScratchPrizeKey,
} from '@/lib/scratch/scratch-config';
import './scratch-card.css';

export type RewardModalProps = {
  open: boolean;
  claim: StoredNyScratchClaim | null;
  grid: NyScratchPrizeKey[] | null;
  boardKey: number;
  revealedCells: boolean[];
  won: boolean;
  claiming: boolean;
  claimError: string | null;
  copied: boolean;
  onScratchStart: () => void;
  onCellReveal: (index: number) => void;
  onRevealWinning: () => void;
  onCopy: () => void;
  onUse: () => void;
  onClose: () => void;
  onRetry: () => void;
};

export function RewardModal({
  open,
  claim,
  grid,
  boardKey,
  revealedCells,
  won,
  claiming,
  claimError,
  copied,
  onScratchStart,
  onCellReveal,
  onRevealWinning,
  onCopy,
  onUse,
  onClose,
  onRetry,
}: RewardModalProps) {
  const t = useTranslations('newYearScratch');
  const dialogRef = useRef<HTMLDivElement>(null);
  const cells = Array.isArray(revealedCells) ? revealedCells : [];
  const prize = claim ? getNyScratchPrize(claim.prizeKey) : null;
  const jackpot = Boolean(prize?.jackpot);
  const showGrid = !won || cells.some(Boolean);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const root = dialogRef.current;
    const focusTarget =
      root?.querySelector<HTMLElement>('canvas, button') ?? root;
    focusTarget?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !root) return;
      const nodes = [
        ...root.querySelectorAll<HTMLElement>(
          'button, [href], canvas, [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((node) => !node.hasAttribute('disabled') && node.tabIndex !== -1);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="ny-scratch-overlay fixed inset-0 z-[65] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#050b16]/75 backdrop-blur-sm"
        aria-label={t('close')}
        onClick={onClose}
      />
      <ConfettiEffect active={won} jackpot={jackpot} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ny-scratch-title"
        aria-describedby="ny-scratch-body"
        tabIndex={-1}
        className="ny-scratch-card relative z-[1] max-h-[100dvh] w-full min-w-0 max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-[linear-gradient(180deg,#10233d_0%,#0b1730_55%,#08101f_100%)] p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:max-w-lg sm:rounded-3xl sm:p-6"
      >
        <span
          className="ny-scratch-glow pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#fbbf24]/25 blur-3xl"
          aria-hidden
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label={t('close')}
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#fbbf24]">
          Print8 · 2027
        </p>
        <h2
          id="ny-scratch-title"
          className="mt-2 font-display text-xl font-bold leading-tight sm:text-2xl"
        >
          {t('title')}
        </h2>
        <p
          id="ny-scratch-body"
          aria-live="polite"
          className="mt-2 text-sm leading-relaxed text-white/75"
        >
          {won ? t('winEyebrow') : t('subtitle')}
        </p>

        {showGrid ? (
          <ScratchGrid
            boardKey={boardKey}
            grid={grid}
            revealedCells={cells}
            disabled={won || Boolean(claimError)}
            won={won}
            matchPrizeKey={claim?.prizeKey ?? null}
            hint={t('scratchHint')}
            cellLabel={(n) => t('cellLabel', { n })}
            cellRevealedLabel={(n, prizeKey) =>
              t('cellRevealed', {
                n,
                prize: t(`prizes.${prizeKey}.title`),
              })
            }
            onScratchStart={onScratchStart}
            onCellReveal={onCellReveal}
          />
        ) : null}

        {claiming ? (
          <p className="mt-3 text-center text-sm text-white/80">{t('claiming')}</p>
        ) : null}

        {claimError ? (
          <div className="mt-3 text-center">
            <p className="text-sm text-red-200">{claimError}</p>
            <Button type="button" size="sm" className="mt-3" onClick={onRetry}>
              {t('retry')}
            </Button>
          </div>
        ) : null}

        {!won && !claimError ? (
          <button
            type="button"
            className="mt-3 w-full text-center text-xs font-medium text-white/55 underline-offset-2 hover:text-white hover:underline"
            onClick={onRevealWinning}
          >
            {t('revealWithoutScratch')}
          </button>
        ) : null}

        {won && claim && prize ? (
          <div className="ny-scratch-win mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#fbbf24]/35 bg-black/25 px-3 py-3">
              {jackpot ? (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-[#fbbf24]/50 bg-[#fbbf24]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#fbbf24]">
                  <Sparkles className="h-3 w-3" />
                  {t('jackpot')}
                </span>
              ) : (
                <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#fbbf24]" aria-hidden />
              )}
              <div>
                <p className="text-base font-bold text-white">
                  {t(`prizes.${claim.prizeKey}.title`)}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {t(`prizes.${claim.prizeKey}.body`)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-[#fbbf24]/35 bg-black/25 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                {t('couponLabel')}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-mono text-lg font-bold tracking-[0.14em] text-[#fbbf24]">
                  {claim.couponCode}
                </p>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" size="lg" className="w-full" onClick={onUse}>
                {t('useDiscount')}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={onClose}
              >
                {t('close')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
