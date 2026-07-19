'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, HelpCircle, Mail, MessageCircleQuestion, BookOpen, PackageSearch } from 'lucide-react';

const helpLinks = [
  {
    href: '/how-to-order',
    key: 'howToOrder',
    descriptionKey: 'helpMenu.howToOrderDesc',
    icon: BookOpen,
  },
  {
    href: '/order-status',
    key: 'orderStatus',
    descriptionKey: 'helpMenu.orderStatusDesc',
    icon: PackageSearch,
  },
  {
    href: '/contact',
    key: 'contact',
    descriptionKey: 'helpMenu.contactDesc',
    icon: Mail,
  },
  {
    href: '/faq',
    key: 'faq',
    descriptionKey: 'helpMenu.faqDesc',
    icon: MessageCircleQuestion,
  },
] as const;

export function isHelpNavActive(pathname: string): boolean {
  return helpLinks.some((item) => pathname === item.href);
}

export function HelpNavDropdown() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = isHelpNavActive(pathname);

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
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex items-center gap-1 border-x border-transparent px-2.5 py-2.5 text-sm font-semibold uppercase tracking-wide transition lg:px-3',
          active || open
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
        )}
      >
        {t('helpMenu.label')}
        <ChevronDown
          className={cn('h-4 w-4 transition', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-0 min-w-[16rem] pt-2"
        >
          <div className="overflow-hidden rounded-xl border border-ink-200 bg-white p-2 shadow-xl">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-brand-600">
              {t('helpMenu.eyebrow')}
            </p>
            <ul className="space-y-1">
              {helpLinks.map((item) => {
                const Icon = item.icon;
                const itemActive = pathname === item.href;

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-start gap-3 rounded-lg px-3 py-2.5 transition',
                        itemActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-700 hover:bg-ink-50',
                      )}
                    >
                      <Icon
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          itemActive ? 'text-brand-600' : 'text-ink-400',
                        )}
                        aria-hidden
                      />
                      <span>
                        <span className="block text-sm font-semibold">
                          {t(item.key)}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                          {t(item.descriptionKey)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 border-t border-ink-100 px-3 py-2">
              <p className="flex items-center gap-2 text-xs text-ink-500">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {t('helpMenu.hint')}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
