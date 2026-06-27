'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { DesignsNavMenu } from '@/components/layout/DesignsNavMenu';
import { isDesignsNavActive } from '@/lib/designs/design-nav';

export function DesignsNavDropdown() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = isDesignsNavActive(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={cn(
          'flex items-center gap-1 border-x border-transparent px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition',
          active || open
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
        )}
      >
        {t('designs')}
        <ChevronDown
          className={cn('h-4 w-4 transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute left-1/2 top-full z-50 mt-0 w-[min(100vw-2rem,42rem)] -translate-x-1/2 pt-2"
        >
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white p-4 shadow-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {t('designsMenu.eyebrow')}
                </p>
                <p className="mt-0.5 text-sm text-ink-600">
                  {t('designsMenu.subtitle')}
                </p>
              </div>
              <Link
                href="/designs"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-brand-700"
              >
                {t('designsMenu.viewAll')}
              </Link>
            </div>
            <DesignsNavMenu onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
