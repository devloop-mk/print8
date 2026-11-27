'use client';

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  ScratchCard,
  type ScratchCardHandle,
} from '@/components/scratch/ScratchCard';
import { NyScratchPrizeMark } from '@/components/scratch/NyScratchPrizeMark';
import {
  NY_SCRATCH_CELL_COUNT,
  type NyScratchPrizeKey,
} from '@/lib/scratch/scratch-config';

export type ScratchGridProps = {
  boardKey: number;
  grid: NyScratchPrizeKey[] | null;
  revealedCells: boolean[];
  disabled?: boolean;
  won?: boolean;
  matchPrizeKey?: NyScratchPrizeKey | null;
  hint: string;
  cellLabel: (n: number) => string;
  cellRevealedLabel: (n: number, prizeKey: NyScratchPrizeKey) => string;
  onScratchStart: () => void;
  onCellReveal: (index: number) => void;
};

export function ScratchGrid({
  boardKey,
  grid,
  revealedCells,
  disabled = false,
  won = false,
  matchPrizeKey = null,
  hint,
  cellLabel,
  cellRevealedLabel,
  onScratchStart,
  onCellReveal,
}: ScratchGridProps) {
  const cardsRef = useRef<Array<ScratchCardHandle | null>>([]);
  const drawing = useRef(false);
  const startedLock = useRef(false);
  const lastClient = useRef<{ x: number; y: number } | null>(null);
  const checkQueued = useRef(false);
  const boardSeen = useRef(boardKey);
  if (boardSeen.current !== boardKey) {
    boardSeen.current = boardKey;
    startedLock.current = false;
    drawing.current = false;
    lastClient.current = null;
  }
  const foilGone = revealedCells.every(Boolean);

  const scratchAll = useCallback(
    (clientX: number, clientY: number, pointerType: string) => {
      const prev = lastClient.current;
      for (const card of cardsRef.current) {
        card?.scratchAt(clientX, clientY, prev, pointerType);
      }
      lastClient.current = { x: clientX, y: clientY };
    },
    [],
  );

  const checkCards = useCallback(() => {
    for (const card of cardsRef.current) {
      card?.finishIfReady();
    }
  }, []);

  const queueCheck = useCallback(() => {
    if (checkQueued.current) return;
    checkQueued.current = true;
    requestAnimationFrame(() => {
      checkQueued.current = false;
      checkCards();
    });
  }, [checkCards]);

  function markScratchStart() {
    if (startedLock.current || disabled) return;
    startedLock.current = true;
    onScratchStart();
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || foilGone) return;
    event.preventDefault();
    markScratchStart();
    drawing.current = true;
    lastClient.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    scratchAll(event.clientX, event.clientY, event.pointerType || 'mouse');
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drawing.current || disabled) return;
    scratchAll(event.clientX, event.clientY, event.pointerType || 'mouse');
    queueCheck();
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    lastClient.current = null;
    checkCards();
  }

  return (
    <div
      role="group"
      aria-label={hint}
      className={`ny-scratch-grid relative mt-4 min-w-0 w-full cursor-pointer touch-none ${
        disabled || foilGone ? 'pointer-events-none' : ''
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:gap-2.5">
        {Array.from({ length: NY_SCRATCH_CELL_COUNT }, (_, index) => {
          const prizeKey = grid?.[index] ?? null;
          const revealed = Boolean(revealedCells[index]);
          const isMatch = Boolean(
            won && prizeKey && matchPrizeKey && prizeKey === matchPrizeKey && revealed,
          );
          return (
            <ScratchCard
              key={`${boardKey}-${index}`}
              ref={(node) => {
                cardsRef.current[index] = node;
              }}
              revealed={revealed}
              disabled={disabled}
              compact
              gridDriven
              className={isMatch ? 'ny-scratch-cell-match' : undefined}
              label={
                revealed && prizeKey
                  ? cellRevealedLabel(index + 1, prizeKey)
                  : cellLabel(index + 1)
              }
              hint={hint}
              onReveal={() => onCellReveal(index)}
              onScratchStart={onScratchStart}
            >
              {prizeKey ? (
                <NyScratchPrizeMark prizeKey={prizeKey} />
              ) : (
                <span className="text-xs text-white/40">✦</span>
              )}
            </ScratchCard>
          );
        })}
      </div>
    </div>
  );
}
