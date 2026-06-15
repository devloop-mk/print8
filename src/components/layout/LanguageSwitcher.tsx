'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import { Link, usePathname, routing, type Locale } from '@/i18n/routing';
import { localeConfig } from '@/i18n/locale-config';
import { LocaleFlag } from '@/components/ui/LocaleFlag';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const current = localeConfig[locale];

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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={t('language')}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 sm:px-3"
      >
        <LocaleFlag locale={locale} />
        <span>{current.shortLabel}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t('language')}
          className="absolute right-0 z-50 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
        >
          {routing.locales.map((loc) => {
            const selected = loc === locale;

            return (
              <li key={loc} role="option" aria-selected={selected}>
                <Link
                  href={pathname}
                  locale={loc}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-ink-50',
                    selected && 'bg-brand-50 text-brand-700',
                  )}
                >
                  <LocaleFlag locale={loc} />
                  <span className="flex-1 font-medium">{t(`languages.${loc}`)}</span>
                  {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
