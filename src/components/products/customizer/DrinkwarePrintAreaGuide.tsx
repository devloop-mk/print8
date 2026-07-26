'use client';

import type { PrintAreaInsets } from '@/lib/products/print-area';
import { getPrintAreaFrameStyle } from '@/lib/products/print-area';

type DrinkwarePrintAreaGuideProps = {
  /** Printable insets on the flat unwrap canvas. */
  wrapInsets: PrintAreaInsets;
  wrapLabel: string;
  /** @deprecated Front slice is no longer shown — unwrap canvas IS the print area. */
  frontInsets?: PrintAreaInsets;
  frontLabel?: string;
  hidden?: boolean;
  /** Show handle / center orientation markers (mugs). */
  showHandleHint?: boolean;
  /** Single center line when there is no handle seam (thermos, tumbler). */
  showCenterGuide?: boolean;
  handleHintLabel?: string;
  centerLabel?: string;
};

function MugIconHandleLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M10 4h10v14c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V4z" />
      <path d="M10 8H7.5C6.1 8 5 9.1 5 10.5v3C5 14.9 6.1 16 7.5 16H10" />
    </svg>
  );
}

function MugIconHandleRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M8 4h10v14c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V4z" />
      <path d="M18 8h2.5c1.4 0 2.5 1.1 2.5 2.5v3c0 1.4-1.1 2.5-2.5 2.5H18" />
    </svg>
  );
}

/**
 * Printful-style flat unwrap guides:
 * dashed print border + vertical wrap markers (handle-left, center, handle-right).
 */
export function DrinkwarePrintAreaGuide({
  wrapInsets,
  wrapLabel,
  hidden = false,
  showHandleHint = false,
  showCenterGuide = false,
  handleHintLabel,
  centerLabel,
}: DrinkwarePrintAreaGuideProps) {
  if (hidden) return null;

  const wrapFrame = getPrintAreaFrameStyle(wrapInsets);
  const printTop = wrapInsets.top;
  const printLeft = wrapInsets.left;
  const printRight = wrapInsets.right;
  const printWidth = 100 - printLeft - printRight;
  const centerX = printLeft + printWidth / 2;
  const leftGuideX = printLeft;
  const rightGuideX = 100 - printRight;

  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
      <div
        className="absolute inset-x-0 top-0 bg-ink-900/[0.04]"
        style={{ height: wrapFrame.top }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-ink-900/[0.04]"
        style={{ height: wrapFrame.bottom }}
      />
      {wrapInsets.left > 0 ? (
        <div
          className="absolute left-0 bg-ink-900/[0.04]"
          style={{
            top: wrapFrame.top,
            bottom: wrapFrame.bottom,
            width: wrapFrame.left,
          }}
        />
      ) : null}
      {wrapInsets.right > 0 ? (
        <div
          className="absolute right-0 bg-ink-900/[0.04]"
          style={{
            top: wrapFrame.top,
            bottom: wrapFrame.bottom,
            width: wrapFrame.right,
          }}
        />
      ) : null}

      <div
        className="absolute rounded-sm border-2 border-dashed border-ink-400/55 bg-transparent"
        style={wrapFrame}
      >
        <span className="absolute left-1.5 top-1.5 hidden rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-ink-600 shadow-sm md:inline">
          {wrapLabel}
        </span>
      </div>

      {showHandleHint ? (
        <>
          <div
            className="absolute w-px bg-ink-300/80"
            style={{
              left: `${leftGuideX}%`,
              top: `${printTop}%`,
              bottom: `${wrapInsets.bottom}%`,
            }}
          />
          <div
            className="absolute w-px bg-ink-300/80"
            style={{
              left: `${centerX}%`,
              top: `${printTop}%`,
              bottom: `${wrapInsets.bottom}%`,
            }}
          />
          <div
            className="absolute w-px bg-ink-300/80"
            style={{
              left: `${rightGuideX}%`,
              top: `${printTop}%`,
              bottom: `${wrapInsets.bottom}%`,
            }}
          />

          <div
            className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-ink-500"
            style={{ left: `${leftGuideX}%`, bottom: '1.5%' }}
          >
            <MugIconHandleLeft className="h-5 w-6" />
            {handleHintLabel ? (
              <span className="max-w-[4.5rem] truncate text-center text-[9px] font-medium leading-tight">
                {handleHintLabel}
              </span>
            ) : null}
          </div>

          <div
            className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-ink-500"
            style={{ left: `${centerX}%`, bottom: '1.5%' }}
          >
            <span className="whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-ink-600 shadow-sm">
              {centerLabel ?? 'Center of mug'}
            </span>
          </div>

          <div
            className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-ink-500"
            style={{ left: `${rightGuideX}%`, bottom: '1.5%' }}
          >
            <MugIconHandleRight className="h-5 w-6" />
            {handleHintLabel ? (
              <span className="max-w-[4.5rem] truncate text-center text-[9px] font-medium leading-tight">
                {handleHintLabel}
              </span>
            ) : null}
          </div>
        </>
      ) : showCenterGuide ? (
        <>
          <div
            className="absolute w-px bg-ink-300/80"
            style={{
              left: `${centerX}%`,
              top: `${printTop}%`,
              bottom: `${wrapInsets.bottom}%`,
            }}
          />
          <div
            className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5 text-ink-500"
            style={{ left: `${centerX}%`, bottom: '1.5%' }}
          >
            <span className="whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-ink-600 shadow-sm">
              {centerLabel ?? 'Center'}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

type DrinkwareWrapHintProps = {
  children: React.ReactNode;
  className?: string;
};

export function DrinkwareWrapHint({
  children,
  className = '',
}: DrinkwareWrapHintProps) {
  return (
    <p
      className={`max-w-[min(36rem,92vw)] text-center text-[11px] leading-snug text-ink-600 ${className}`}
    >
      {children}
    </p>
  );
}
