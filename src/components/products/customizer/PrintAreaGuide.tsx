'use client';

import type { PrintAreaInsets } from '@/lib/products/print-area';
import { getPrintAreaFrameStyle } from '@/lib/products/print-area';

type PrintAreaGuideProps = {
  insets: PrintAreaInsets;
  hidden?: boolean;
  label?: string;
};

export function PrintAreaGuide({
  insets,
  hidden = false,
  label,
}: PrintAreaGuideProps) {
  if (hidden) return null;

  const frame = getPrintAreaFrameStyle(insets);

  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
      <div
        className="absolute inset-x-0 top-0 bg-ink-900/[0.06]"
        style={{ height: frame.top }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-ink-900/[0.06]"
        style={{ height: frame.bottom }}
      />
      <div
        className="absolute left-0 bg-ink-900/[0.06]"
        style={{ top: frame.top, bottom: frame.bottom, width: frame.left }}
      />
      <div
        className="absolute right-0 bg-ink-900/[0.06]"
        style={{ top: frame.top, bottom: frame.bottom, width: frame.right }}
      />

      <div
        className="absolute rounded-lg border-2 border-dashed border-ink-900/30"
        style={frame}
      />

      {label ? (
        <span
          className="absolute hidden rounded bg-white/55 px-1.5 py-0.5 text-[10px] font-medium text-ink-600/75 shadow-sm md:inline"
          style={{
            left: frame.left,
            top: frame.top,
            transform: 'translateY(calc(-100% - 3px))',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
