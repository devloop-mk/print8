'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { NY_SCRATCH_REVEAL_RATIO } from '@/lib/scratch/scratch-config';

export type ScratchCardHandle = {
  scratchAt: (
    clientX: number,
    clientY: number,
    prev: { x: number; y: number } | null,
    pointerType?: string,
  ) => void;
  finishIfReady: () => boolean;
};

export type ScratchCardProps = {
  revealed: boolean;
  disabled?: boolean;
  compact?: boolean;
  /** When true, this cell does not capture pointers — the parent grid drives scratching. */
  gridDriven?: boolean;
  className?: string;
  label: string;
  hint: string;
  onReveal: () => void;
  onScratchStart?: () => void;
  children: ReactNode;
};

const SAMPLE_STEP = 8;
/** CSS pixels of real movement on this cell before auto-reveal can fire. */
const MIN_REVEAL_TRAVEL_PX = 32;

function isTouchPointer(pointerType: string | undefined): boolean {
  return pointerType === 'touch' || pointerType === 'pen';
}

/** Visual scratch radius in canvas pixels. Mouse is a mid-size brush; touch stays finger-sized. */
function brushRadius(
  canvas: HTMLCanvasElement,
  compact: boolean,
  pointerType: string | undefined,
): number {
  const cssW = canvas.getBoundingClientRect().width;
  const cssH = canvas.getBoundingClientRect().height;
  const cssMin = Math.min(cssW, cssH);
  const dpr = canvas.width / Math.max(1, cssW);
  const touch = isTouchPointer(pointerType);
  let cssRadius: number;
  if (compact) {
    cssRadius = touch
      ? Math.max(11, Math.min(16, cssMin * 0.12))
      : Math.max(10, Math.min(12, cssMin * 0.09));
  } else {
    cssRadius = touch
      ? Math.max(14, cssMin * 0.07)
      : Math.max(12, cssMin * 0.06);
  }
  return cssRadius * dpr;
}

function nearRect(
  point: { x: number; y: number },
  width: number,
  height: number,
  pad: number,
): boolean {
  return (
    point.x >= -pad &&
    point.y >= -pad &&
    point.x <= width + pad &&
    point.y <= height + pad
  );
}

function segmentHitsCell(
  point: { x: number; y: number },
  prev: { x: number; y: number } | null,
  width: number,
  height: number,
  pad: number,
): boolean {
  if (nearRect(point, width, height, pad)) return true;
  if (!prev) return false;
  if (nearRect(prev, width, height, pad)) return true;
  const dist = Math.hypot(point.x - prev.x, point.y - prev.y);
  const steps = Math.max(2, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const sample = {
      x: prev.x + (point.x - prev.x) * t,
      y: prev.y + (point.y - prev.y) * t,
    };
    if (nearRect(sample, width, height, pad)) return true;
  }
  return false;
}

export const ScratchCard = forwardRef<ScratchCardHandle, ScratchCardProps>(
  function ScratchCard(
    {
      revealed,
      disabled = false,
      compact = false,
      gridDriven = false,
      className,
      label,
      hint,
      onReveal,
      onScratchStart,
      children,
    },
    ref,
  ) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const revealedLock = useRef(false);
    const startedLock = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const travelPx = useRef(0);
    const pointerTypeRef = useRef<string>('mouse');
    const dirtyRef = useRef(false);
    const [hasScratch, setHasScratch] = useState(false);

    const paintFoil = useCallback(
      (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const { width, height } = canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        const fill = ctx.createLinearGradient(0, 0, width, height);
        fill.addColorStop(0, '#1c5082');
        fill.addColorStop(0.48, '#3e408d');
        fill.addColorStop(1, '#163a62');
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
        const sparkles = compact ? 12 : 42;
        for (let i = 0; i < sparkles; i += 1) {
          const x = ((i * 97) % width) + (i % 7) * 3;
          const y = ((i * 53) % height) + (i % 5) * 2;
          ctx.beginPath();
          ctx.arc(x, y, 1.2 + (i % 3) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!compact) {
          const inset = 10;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
          ctx.lineWidth = 2;
          ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `600 ${Math.max(14, width * 0.055)}px system-ui, sans-serif`;
          ctx.fillText(hint, width / 2, height / 2);
        }
      },
      [compact, hint],
    );

    const resizeCanvas = useCallback(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;
      const width = Math.max(1, wrap.clientWidth);
      const height = Math.max(1, wrap.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.max(1, Math.round(width * dpr));
      const nextH = Math.max(1, Math.round(height * dpr));
      if (canvas.width === nextW && canvas.height === nextH) return;
      canvas.width = nextW;
      canvas.height = nextH;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (!revealedLock.current && !revealed) paintFoil(canvas);
    }, [paintFoil, revealed]);

    useEffect(() => {
      const frame = window.requestAnimationFrame(() => resizeCanvas());
      const wrap = wrapRef.current;
      if (!wrap || typeof ResizeObserver === 'undefined') {
        return () => window.cancelAnimationFrame(frame);
      }
      const observer = new ResizeObserver(() => {
        if (revealedLock.current || revealed || dirtyRef.current) return;
        resizeCanvas();
      });
      observer.observe(wrap);
      return () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
      };
    }, [resizeCanvas, revealed]);

    useEffect(() => {
      revealedLock.current = revealed;
      if (!revealed) {
        startedLock.current = false;
        travelPx.current = 0;
        dirtyRef.current = false;
        const canvas = canvasRef.current;
        if (canvas && canvas.width > 1 && canvas.height > 1) paintFoil(canvas);
      }
    }, [paintFoil, revealed]);

    const toCanvasPoint = useCallback((clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    }, []);

    const clearedRatio = useCallback((): number => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return 0;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0;
      let total = 0;
      for (let i = 3; i < data.length; i += 4 * SAMPLE_STEP) {
        total += 1;
        if (data[i] < 16) clear += 1;
      }
      return total === 0 ? 0 : clear / total;
    }, []);

    const scratchSegment = useCallback(
      (
        clientX: number,
        clientY: number,
        prevClient: { x: number; y: number } | null,
        pointerType?: string,
      ) => {
        if (disabled || revealedLock.current || revealed) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (!canvas || !ctx) return;
        const point = toCanvasPoint(clientX, clientY);
        if (!point) return;
        const prev = prevClient ? toCanvasPoint(prevClient.x, prevClient.y) : null;
        const radius = brushRadius(
          canvas,
          compact,
          pointerType ?? pointerTypeRef.current,
        );
        if (!segmentHitsCell(point, prev, canvas.width, canvas.height, radius * 1.25)) {
          return;
        }
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = radius * 2;
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        if (prev) {
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(point.x, point.y);
        } else {
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.x + 0.15, point.y);
        }
        ctx.stroke();
        lastPoint.current = point;
        dirtyRef.current = true;
        if (prevClient) {
          travelPx.current += Math.hypot(
            clientX - prevClient.x,
            clientY - prevClient.y,
          );
        }
        setHasScratch(true);
      },
      [compact, disabled, revealed, toCanvasPoint],
    );

    const finishIfReady = useCallback((): boolean => {
      if (revealedLock.current || disabled || revealed) return false;
      if (travelPx.current < MIN_REVEAL_TRAVEL_PX) return false;
      if (clearedRatio() < NY_SCRATCH_REVEAL_RATIO) return false;
      revealedLock.current = true;
      onReveal();
      return true;
    }, [clearedRatio, disabled, onReveal, revealed]);

    const markScratchStart = useCallback(() => {
      if (startedLock.current || disabled || revealed) return;
      startedLock.current = true;
      onScratchStart?.();
    }, [disabled, onScratchStart, revealed]);

    useImperativeHandle(
      ref,
      () => ({
        scratchAt(clientX, clientY, prev, pointerType) {
          if (disabled || revealedLock.current || revealed) return;
          if (pointerType) pointerTypeRef.current = pointerType;
          markScratchStart();
          scratchSegment(clientX, clientY, prev, pointerType);
        },
        finishIfReady,
      }),
      [disabled, finishIfReady, markScratchStart, revealed, scratchSegment],
    );

    function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
      if (gridDriven || disabled || revealed) return;
      event.preventDefault();
      pointerTypeRef.current = event.pointerType || 'mouse';
      markScratchStart();
      drawing.current = true;
      lastPoint.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      scratchSegment(event.clientX, event.clientY, null, event.pointerType);
    }

    function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
      if (gridDriven || !drawing.current || disabled || revealed) return;
      const prev = lastPoint.current;
      const canvas = canvasRef.current;
      let prevClient: { x: number; y: number } | null = null;
      if (prev && canvas) {
        const rect = canvas.getBoundingClientRect();
        prevClient = {
          x: rect.left + (prev.x / canvas.width) * rect.width,
          y: rect.top + (prev.y / canvas.height) * rect.height,
        };
      }
      scratchSegment(event.clientX, event.clientY, prevClient, event.pointerType);
      finishIfReady();
    }

    function onPointerUp() {
      if (gridDriven || !drawing.current) return;
      drawing.current = false;
      lastPoint.current = null;
      finishIfReady();
    }

    function onKeyReveal(event: React.KeyboardEvent<HTMLElement>) {
      if (disabled || revealed) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      markScratchStart();
      revealedLock.current = true;
      onReveal();
    }

    return (
      <div
        ref={wrapRef}
        className={
          compact
            ? `relative aspect-square w-full min-w-0 overflow-hidden rounded-xl border border-[#fbbf24]/55 bg-[#0b1c33] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18),0_10px_24px_rgba(8,16,40,0.4)] ${className ?? ''}`
            : `relative aspect-[1.55/1] w-full overflow-hidden rounded-2xl border border-[#fbbf24]/40 bg-[#0b1c33] shadow-[0_18px_40px_rgba(8,16,40,0.45)] ${className ?? ''}`
        }
      >
        <div
          className={
            compact
              ? 'absolute inset-0 flex items-center justify-center p-2 sm:p-2.5'
              : 'absolute inset-0'
          }
        >
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full rounded-[inherit] touch-none ${
            revealed
              ? 'pointer-events-none opacity-0 transition-opacity duration-500 ease-out'
              : 'opacity-100'
          } ${gridDriven ? 'pointer-events-none' : ''}`}
          aria-label={label}
          role="button"
          tabIndex={disabled || revealed ? -1 : 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyReveal}
        />
        {!revealed && !hasScratch && !compact ? (
          <p className="ny-scratch-foil-hint pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
