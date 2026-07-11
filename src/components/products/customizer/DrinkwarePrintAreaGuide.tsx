'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { getPrintAreaFrameStyle } from '@/lib/products/print-area';

type DrinkwarePrintAreaGuideProps = {
  frontInsets: PrintAreaInsets;
  wrapInsets: PrintAreaInsets;
  wrapLabel: string;
  frontLabel: string;
  hidden?: boolean;
};

export function DrinkwarePrintAreaGuide({
  frontInsets,
  wrapInsets,
  wrapLabel,
  frontLabel,
  hidden = false,
}: DrinkwarePrintAreaGuideProps) {
  if (hidden) return null;

  const wrapFrame = getPrintAreaFrameStyle(wrapInsets);
  const frontFrame = getPrintAreaFrameStyle(frontInsets);
  const leftBandWidth = Math.max(0, frontInsets.left - wrapInsets.left);
  const rightBandWidth = Math.max(0, frontInsets.right - wrapInsets.right);

  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
      <div
        className="absolute inset-x-0 top-0 bg-ink-900/[0.06]"
        style={{ height: wrapFrame.top }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-ink-900/[0.06]"
        style={{ height: wrapFrame.bottom }}
      />
      <div
        className="absolute left-0 bg-ink-900/[0.06]"
        style={{ top: wrapFrame.top, bottom: wrapFrame.bottom, width: wrapFrame.left }}
      />
      <div
        className="absolute right-0 bg-ink-900/[0.06]"
        style={{ top: wrapFrame.top, bottom: wrapFrame.bottom, width: wrapFrame.right }}
      />

      <div
        className="absolute rounded-lg border-2 border-dashed border-brand-500/45 bg-brand-50/10"
        style={wrapFrame}
      >
        <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 shadow-sm">
          {wrapLabel}
        </span>
      </div>

      {leftBandWidth > 2 ? (
        <div
          className="absolute flex items-center justify-center text-brand-600/70"
          style={{
            top: wrapFrame.top,
            bottom: wrapFrame.bottom,
            left: wrapFrame.left,
            width: `${leftBandWidth}%`,
          }}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        </div>
      ) : null}

      {rightBandWidth > 2 ? (
        <div
          className="absolute flex items-center justify-center text-brand-600/70"
          style={{
            top: wrapFrame.top,
            bottom: wrapFrame.bottom,
            right: wrapFrame.right,
            width: `${rightBandWidth}%`,
          }}
        >
          <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        </div>
      ) : null}

      <div
        className="absolute rounded-md border border-dashed border-ink-900/25"
        style={frontFrame}
      >
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/85 px-1.5 py-0.5 text-[9px] font-medium text-ink-500 shadow-sm">
          {frontLabel}
        </span>
      </div>
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
      className={`max-w-[min(18rem,78vw)] text-center text-[11px] leading-snug text-ink-600 md:max-w-[min(28rem,46vh)] lg:max-w-[min(32rem,52vh)] xl:max-w-[min(36rem,58vh)] ${className}`}
    >
      {children}
    </p>
  );
}
