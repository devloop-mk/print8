'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { HolidayProductGlyph } from '@/components/holiday/HolidayProductGlyph';
import {
  HOLIDAY_PRODUCTS,
  HOLIDAY_WORKSHOP_DURATION_MS,
  HOLIDAY_WORKSHOP_TARGET,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import { cn } from '@/lib/utils';

type FallingItem = {
  id: number;
  kind: HolidayProductKind;
  x: number;
  y: number;
  born: number;
  duration: number;
  rotation: number;
  golden: boolean;
  size: number;
};

type CatchFx = {
  id: number;
  kind: HolidayProductKind;
  x: number;
  y: number;
  size: number;
  golden: boolean;
};

const KINDS = HOLIDAY_PRODUCTS.map((item) => item.id);

function randomKind(): HolidayProductKind {
  return KINDS[Math.floor(Math.random() * KINDS.length)] ?? 'mug';
}

export function HolidayWorkshopCanvas({
  reducedMotion,
  onComplete,
  onClose,
  onRetry,
}: {
  reducedMotion: boolean;
  onComplete: (collectedKinds: HolidayProductKind[]) => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations('holidayWorkshop');
  const playRef = useRef<HTMLDivElement>(null);
  const sackRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const collectedKindsRef = useRef<HolidayProductKind[]>([]);
  const nextId = useRef(1);
  const [collected, setCollected] = useState(0);
  const [remainingMs, setRemainingMs] = useState(HOLIDAY_WORKSHOP_DURATION_MS);
  const [sackX, setSackX] = useState(50);
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [catchFx, setCatchFx] = useState<CatchFx[]>([]);
  const fxId = useRef(1);
  const startedAt = useRef(0);
  const lastSpawn = useRef(0);
  const finished = useRef(false);
  const frameRef = useRef(0);

  const complete = useCallback(
    (outcome: 'won' | 'lost') => {
      if (finished.current) return;
      finished.current = true;
      cancelAnimationFrame(frameRef.current);
      setStatus(outcome);
      if (outcome === 'won') {
        onComplete(collectedKindsRef.current);
      }
    },
    [onComplete],
  );

  const spawnCatchFx = useCallback((item: FallingItem) => {
    const fx: CatchFx = {
      id: fxId.current,
      kind: item.kind,
      x: item.x,
      y: item.y,
      size: item.size,
      golden: item.golden,
    };
    fxId.current += 1;
    setCatchFx((prev) => [...prev, fx]);
    const sack = sackRef.current;
    if (sack && !reducedMotion) {
      sack.classList.remove('hw-sack-catch');
      void sack.offsetWidth;
      sack.classList.add('hw-sack-catch');
    }
    window.setTimeout(() => {
      setCatchFx((prev) => prev.filter((entry) => entry.id !== fx.id));
    }, 720);
  }, [reducedMotion]);

  const collectItem = useCallback(
    (id: number) => {
      if (finished.current) return;
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) return;
      itemsRef.current = itemsRef.current.filter((entry) => entry.id !== id);
      collectedKindsRef.current = [...collectedKindsRef.current, item.kind];
      spawnCatchFx(item);
      const next = collectedKindsRef.current.length;
      if (next >= HOLIDAY_WORKSHOP_TARGET) {
        setCollected(next);
        complete('won');
        return;
      }
      setCollected(next);
    },
    [complete, spawnCatchFx],
  );

  useEffect(() => {
    startedAt.current = performance.now();
    lastSpawn.current = startedAt.current - 200;

    const loop = (now: number) => {
      if (finished.current) return;
      const elapsed = now - startedAt.current;
      const left = Math.max(0, HOLIDAY_WORKSHOP_DURATION_MS - elapsed);
      setRemainingMs(left);

      const spawnEvery = reducedMotion ? 900 : 620;
      if (now - lastSpawn.current >= spawnEvery && itemsRef.current.length < 12) {
        lastSpawn.current = now;
        itemsRef.current = [
          ...itemsRef.current,
          {
            id: nextId.current,
            kind: randomKind(),
            x: 8 + Math.random() * 84,
            y: reducedMotion ? 18 + Math.random() * 48 : -8,
            born: now,
            duration: reducedMotion ? 5200 : 3800 + Math.random() * 1400,
            rotation: (Math.random() - 0.5) * 28,
            golden: Math.random() < 0.08,
            size: 58 + Math.random() * 18,
          },
        ];
        nextId.current += 1;
      }

      const play = playRef.current;
      const sack = sackRef.current;
      const playBox = play?.getBoundingClientRect();
      const sackBox = sack?.getBoundingClientRect();

      itemsRef.current = itemsRef.current.filter((item) => {
        const progress = (now - item.born) / item.duration;
        if (reducedMotion) {
          item.y = 16 + Math.sin((now - item.born) / 700 + item.x) * 6 + (item.id % 5) * 10;
        } else {
          item.y = -16 + progress * 128;
        }

        if (playBox && sackBox && progress > 0.15) {
          const itemPx = playBox.left + (item.x / 100) * playBox.width;
          const itemPy = playBox.top + (item.y / 100) * playBox.height;
          const hit =
            itemPx > sackBox.left + 8 &&
            itemPx < sackBox.right - 8 &&
            itemPy > sackBox.top + 4 &&
            itemPy < sackBox.bottom;
          if (hit) {
            collectItem(item.id);
            return false;
          }
        }

        return progress < 1.05;
      });

      if (!finished.current) setTick((value) => value + 1);
      if (left <= 0) {
        complete(collectedKindsRef.current.length >= HOLIDAY_WORKSHOP_TARGET ? 'won' : 'lost');
        return;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [collectItem, complete, reducedMotion]);

  function moveSack(clientX: number) {
    const play = playRef.current;
    if (!play) return;
    const box = play.getBoundingClientRect();
    const next = ((clientX - box.left) / box.width) * 100;
    setSackX(Math.min(88, Math.max(12, next)));
  }

  const seconds = Math.ceil(remainingMs / 1000);
  const items = itemsRef.current;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0d78c]">
            {t('eyebrow')}
          </p>
          <h2 id="holiday-workshop-title" className="font-display text-xl font-bold text-white sm:text-2xl">
            {t('gameTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold tabular-nums text-white backdrop-blur-md',
              collected > 0 && 'hw-counter-pop',
            )}
            key={collected}
            aria-live="polite"
            data-testid="holiday-counter"
          >
            {t('counter', { collected, target: HOLIDAY_WORKSHOP_TARGET })}
          </div>
          <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm tabular-nums text-white/80">
            {seconds}s
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="relative z-10 px-4 pb-2 text-sm text-white/70 sm:px-6">{t('gameHint')}</p>

      <div
        ref={playRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onMouseMove={(event) => moveSack(event.clientX)}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (touch) moveSack(touch.clientX);
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'absolute -translate-x-1/2 rounded-2xl border border-white/25 bg-white/12 p-1.5 shadow-[0_8px_28px_rgba(8,16,40,0.35)] backdrop-blur-md',
              item.golden && 'border-[#f0d78c]/70 bg-[#f0d78c]/15 shadow-[0_0_24px_rgba(240,215,140,0.45)]',
            )}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size,
              height: item.size,
              transform: `translate(-50%, 0) rotate(${item.rotation}deg)`,
            }}
            onClick={() => collectItem(item.id)}
            aria-label={t(`products.${item.kind}`)}
            data-testid="holiday-falling-item"
            tabIndex={-1}
          >
            <HolidayProductGlyph kind={item.kind} golden={item.golden} className="h-full w-full" />
          </button>
        ))}

        {catchFx.map((fx) => (
          <div
            key={fx.id}
            className="hw-catch-fx"
            style={{
              left: `${fx.x}%`,
              top: `${fx.y}%`,
              width: fx.size,
              height: fx.size,
            }}
          >
            <span className="hw-catch-ring" />
            <div className="hw-catch-pop h-full w-full rounded-2xl border border-[#f0d78c]/60 bg-[#f0d78c]/20 p-1.5">
              <HolidayProductGlyph kind={fx.kind} golden={fx.golden} className="h-full w-full" />
            </div>
            <span className="hw-catch-plus">{t('caught')}</span>
          </div>
        ))}

        <div
          ref={sackRef}
          className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 w-[38%] max-w-[220px] min-w-[132px] -translate-x-1/2 sm:w-[28%]"
          style={{ left: `${sackX}%` }}
          aria-hidden
        >
          <div className="rounded-[1.6rem] border border-white/25 bg-gradient-to-b from-[#3e408d]/90 to-[#1c5082] px-3 py-3 text-center shadow-[0_16px_40px_rgba(8,16,40,0.45)]">
            <p className="text-2xl" aria-hidden>
              🎅
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f0d78c]">
              {t('sackLabel')}
            </p>
          </div>
        </div>

        {status === 'lost' ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071225]/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-white shadow-xl backdrop-blur-xl">
              <p className="font-display text-2xl font-bold">{t('missTitle')}</p>
              <p className="mt-2 text-sm text-white/75">{t('missBody')}</p>
              <button
                type="button"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-[#f0d78c]/40 bg-gradient-to-r from-[#1c5082] to-[#3e408d] px-5 text-sm font-semibold uppercase tracking-wide text-white"
                onClick={() => {
                  finished.current = false;
                  onRetry();
                }}
              >
                {t('tryAgain')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <span className="sr-only" aria-live="polite">
        {tick >= 0 ? t('counter', { collected, target: HOLIDAY_WORKSHOP_TARGET }) : null}
      </span>
    </div>
  );
}
