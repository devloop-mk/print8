'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, X } from 'lucide-react';
import { OUT_OF_PRINT_AREA_EVENT } from '@/lib/products/print-area-events';

const AUTO_DISMISS_MS = 4500;

/**
 * Bilingual toast shown when a layer is dropped/resized fully outside the
 * print area and gets auto-recentered. Mounted once; listens for a window
 * event dispatched from deep inside the drag/resize handlers so it doesn't
 * need to be threaded through every overlay component.
 */
export function OutOfPrintAreaToast() {
  const t = useTranslations('products.customizer');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const show = () => {
      setVisible(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    };

    window.addEventListener(OUT_OF_PRINT_AREA_EVENT, show);
    return () => {
      window.removeEventListener(OUT_OF_PRINT_AREA_EVENT, show);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-3 md:top-[4.25rem]"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <p className="leading-snug">{t('outOfPrintAreaNotice')}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-1 shrink-0 text-amber-700/70 transition hover:text-amber-900"
          aria-label={t('close')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
