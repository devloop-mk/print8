'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useOngoingDesigns } from '@/components/drafts/OngoingDesignsProvider';
import type {
  OngoingDesignItem,
  OngoingDesignSource,
} from '@/lib/drafts/ongoing-designs';
import { cn } from '@/lib/utils';
import { BookmarkCheck, PenLine, Trash2, X } from 'lucide-react';

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
  if (source === 'product') return t('sourceProduct');
  return t('sourceTemplate');
}

type SaveDesignHintProps = {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
  variant: 'desktop' | 'mobile-banner' | 'mobile-drawer';
};

function SaveDesignHint({
  message,
  dismissLabel,
  onDismiss,
  variant,
}: SaveDesignHintProps) {
  const isDesktop = variant === 'desktop';
  const isDrawer = variant === 'mobile-drawer';

  return (
    <div
      className={cn(
        'relative border-2 border-brand-600 bg-white text-ink-900 shadow-lift-brand',
        isDesktop && 'rounded-xl px-4 py-3.5 pr-10',
        variant === 'mobile-banner' && 'rounded-lg px-3.5 py-3 pr-9 shadow-md',
        isDrawer && 'rounded-lg px-3 py-2.5 pr-9 shadow-sm',
      )}
    >
      {isDesktop ? (
        <div
          className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l-2 border-t-2 border-brand-600 bg-white"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'flex items-start',
          isDesktop ? 'gap-3' : 'gap-2.5',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-brand-600 text-white',
            isDesktop ? 'h-10 w-10' : isDrawer ? 'h-8 w-8' : 'h-9 w-9',
          )}
        >
          <BookmarkCheck
            className={cn(
              'shrink-0',
              isDesktop ? 'h-5 w-5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
        </div>
        <p
          className={cn(
            'min-w-0 font-semibold leading-snug',
            isDesktop ? 'pt-1.5 text-sm' : isDrawer ? 'pt-1 text-xs' : 'pt-1 text-sm',
          )}
        >
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          'absolute rounded text-ink-400 transition hover:bg-ink-50 hover:text-ink-700',
          isDesktop ? 'right-2 top-2 p-1' : 'right-1.5 top-1.5 p-0.5',
        )}
        aria-label={dismissLabel}
      >
        <X
          className={cn(isDesktop ? 'h-4 w-4' : 'h-3.5 w-3.5')}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

type OngoingDesignRowProps = {
  item: OngoingDesignItem;
  locale: string;
  t: ReturnType<typeof useTranslations<'nav.ongoingDesigns'>>;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
  className?: string;
};

function OngoingDesignRow({
  item,
  locale,
  t,
  onDelete,
  onNavigate,
  className,
}: OngoingDesignRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 transition hover:bg-ink-50',
        className,
      )}
    >
      <Link
        href={item.href}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-start gap-3"
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
        <div className="min-w-0 flex-1 py-0.5">
          <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {sourceLabel(item.source, t)} · {formatUpdatedAt(item.updatedAt, locale)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="mt-2 shrink-0 rounded p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-red-600"
        aria-label={t('delete', { name: item.name })}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
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
  const { items, count, hydrated, saveHintVisible, remove, dismissSaveHint } =
    useOngoingDesigns();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const handleDelete = (id: string) => {
    remove(id);
    if (count <= 1) {
      setOpen(false);
    }
  };

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

  if (!hydrated || (count === 0 && !saveHintVisible)) {
    return null;
  }

  if (variant === 'mobile') {
    return (
      <div className="mt-4 border-t border-ink-100 pt-4">
        {saveHintVisible ? (
          <div className="mb-3 px-4" role="status">
            <SaveDesignHint
              message={t('saveHint')}
              dismissLabel={t('dismissHint')}
              onDismiss={dismissSaveHint}
              variant="mobile-drawer"
            />
          </div>
        ) : null}
        <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-ink-400">
          {t('title')}
        </p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <OngoingDesignRow
                item={item}
                locale={locale}
                t={t}
                onDelete={handleDelete}
                onNavigate={onNavigate}
                className="rounded-xl px-4 py-3"
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => {
          dismissSaveHint();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={cn(
          'relative border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50',
          open && 'border-ink-200 bg-ink-50',
          saveHintVisible && !open && 'border-brand-200 bg-brand-50 text-brand-700',
        )}
        aria-label={t('open', { count })}
      >
        <PenLine className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center border border-brand-800 bg-brand-600 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      </button>

      {saveHintVisible && !open ? (
        <>
          <div
            role="status"
            className="fixed inset-x-3 top-[calc(3.25rem+2px)] z-[70] sm:inset-x-4 lg:hidden"
          >
            <SaveDesignHint
              message={t('saveHint')}
              dismissLabel={t('dismissHint')}
              onDismiss={dismissSaveHint}
              variant="mobile-banner"
            />
          </div>

          <div
            role="status"
            className="absolute left-1/2 top-full z-[70] mt-2.5 hidden w-[min(calc(100vw-2rem),17rem)] -translate-x-1/2 lg:block"
          >
            <SaveDesignHint
              message={t('saveHint')}
              dismissLabel={t('dismissHint')}
              onDismiss={dismissSaveHint}
              variant="desktop"
            />
          </div>
        </>
      ) : null}

      {open ? (
        <div
          id={panelId}
          className={cn(
            'z-[60] mt-2 w-[min(100vw-2rem,22rem)]',
            'max-lg:fixed max-lg:inset-x-4 max-lg:top-[4.25rem] max-lg:mt-0 max-lg:w-auto',
            'lg:absolute lg:right-0 lg:top-full',
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
                  <OngoingDesignRow
                    item={item}
                    locale={locale}
                    t={t}
                    onDelete={handleDelete}
                    onNavigate={() => setOpen(false)}
                    className="px-4 py-3"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
