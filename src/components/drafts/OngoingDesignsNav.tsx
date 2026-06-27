'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useOngoingDesigns } from '@/components/drafts/OngoingDesignsProvider';
import type { OngoingDesignSource } from '@/lib/drafts/ongoing-designs';
import { cn } from '@/lib/utils';
import { PenLine } from 'lucide-react';

function formatUpdatedAt(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function sourceLabel(
  source: OngoingDesignSource,
  t: ReturnType<typeof useTranslations<'nav.ongoingDesigns'>>,
) {
  if (source === 'studio') return t('sourceStudio');
  if (source === 'product') return t('sourceProduct');
  return t('sourceTemplate');
}

type OngoingDesignsNavProps = {
  variant?: 'header' | 'mobile';
  onNavigate?: () => void;
};

export function OngoingDesignsNav({
  variant = 'header',
  onNavigate,
}: OngoingDesignsNavProps) {
  const t = useTranslations('nav.ongoingDesigns');
  const locale = useLocale();
  const { items, count, hydrated } = useOngoingDesigns();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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

  if (!hydrated || count === 0) {
    return null;
  }

  if (variant === 'mobile') {
    return (
      <div className="mt-4 border-t border-ink-100 pt-4">
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-ink-400">
          {t('title')}
        </p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="flex items-start gap-3 rounded-xl px-4 py-3 transition hover:bg-ink-50"
              >
                {item.previewDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewDataUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-md border border-ink-100 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-ink-100 bg-ink-50 text-ink-400">
                    <PenLine className="h-5 w-5" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {sourceLabel(item.source, t)} ·{' '}
                    {formatUpdatedAt(item.updatedAt, locale)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={cn(
          'relative border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50',
          open && 'border-ink-200 bg-ink-50',
        )}
        aria-label={t('open', { count })}
      >
        <PenLine className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center border border-amber-800 bg-amber-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            'z-[60] mt-2 w-[min(100vw-2rem,22rem)]',
            'max-md:fixed max-md:inset-x-4 max-md:top-[4.25rem] max-md:mt-0 max-md:w-auto',
            'md:absolute md:right-0 md:top-full',
          )}
        >
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl">
            <div className="border-b border-ink-100 px-4 py-3">
              <p className="break-words text-sm font-semibold text-ink-900">{t('title')}</p>
              <p className="mt-1 break-words text-xs text-ink-500">{t('subtitle')}</p>
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-ink-50"
                  >
                    {item.previewDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewDataUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-md border border-ink-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-ink-100 bg-ink-50 text-ink-400">
                        <PenLine className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {sourceLabel(item.source, t)} ·{' '}
                        {formatUpdatedAt(item.updatedAt, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
