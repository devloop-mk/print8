'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ProductsNavMenu } from '@/components/layout/ProductsNavMenu';
import { DesignsNavMenu } from '@/components/layout/DesignsNavMenu';
import { OngoingDesignsNav } from '@/components/drafts/OngoingDesignsNav';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { isProductsNavActive } from '@/lib/products/product-nav';
import { isDesignsNavActive } from '@/lib/designs/design-nav';
import { ChevronDown, Search, ShoppingCart, X } from 'lucide-react';

const navItems = [
  { href: '/', key: 'home' },
  { href: '/services', key: 'services' },
  { href: '/designs', key: 'designs' },
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/faq', key: 'faq' },
] as const;

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
};

export function MobileNav({ open, onClose, onOpenSearch }: MobileNavProps) {
  const t = useTranslations('nav');
  const ts = useTranslations('search');
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [productsOpen, setProductsOpen] = useState(false);
  const [designsOpen, setDesignsOpen] = useState(false);
  const productsActive = isProductsNavActive(pathname);
  const designsActive = isDesignsNavActive(pathname);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (productsActive) setProductsOpen(true);
  }, [productsActive]);

  useEffect(() => {
    if (designsActive) setDesignsOpen(true);
  }, [designsActive]);

  useEffect(() => {
    if (!open) {
      setProductsOpen(false);
      setDesignsOpen(false);
    }
  }, [open]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] md:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('closeMenu')}
        className={cn(
          'absolute inset-0 bg-ink-900/50 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        className={cn(
          'absolute inset-y-0 right-0 flex w-[min(100vw-2.5rem,22rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <Logo className="h-7" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-50"
            aria-label={t('closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {onOpenSearch ? (
          <div className="border-b border-ink-100 px-3 py-3">
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/80 px-4 py-3 text-left text-sm text-ink-500 transition hover:border-ink-300 hover:bg-white"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span>{ts('placeholder')}</span>
            </button>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.slice(0, 2).map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-base font-medium transition',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}

            <li>
              <button
                type="button"
                onClick={() => setDesignsOpen((value) => !value)}
                aria-expanded={designsOpen}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition',
                  designsActive || designsOpen
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-50',
                )}
              >
                {t('designs')}
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 transition',
                    designsOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              {designsOpen ? (
                <div className="mt-1 rounded-xl border border-ink-100 bg-ink-50/80 p-3">
                  <DesignsNavMenu variant="mobile" onNavigate={onClose} />
                </div>
              ) : null}
            </li>

            <li>
              <button
                type="button"
                onClick={() => setProductsOpen((value) => !value)}
                aria-expanded={productsOpen}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition',
                  productsActive || productsOpen
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-50',
                )}
              >
                {t('products')}
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 transition',
                    productsOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              {productsOpen ? (
                <div className="mt-1 rounded-xl border border-ink-100 bg-ink-50/80 p-3">
                  <ProductsNavMenu variant="mobile" onNavigate={onClose} />
                </div>
              ) : null}
            </li>

            {navItems.slice(3).map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'block rounded-xl px-4 py-3 text-base font-medium transition',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <OngoingDesignsNav variant="mobile" onNavigate={onClose} />

          <div className="mt-4 border-t border-ink-100 pt-4">
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <ShoppingCart className="h-5 w-5 text-ink-500" />
              <span className="flex-1">{t('cart')}</span>
              {itemCount > 0 ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </nav>

        <div className="border-t border-ink-100 px-4 py-5">
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">
            {t('language')}
          </p>
          <LanguageSwitcher variant="list" onLocaleChange={onClose} />
        </div>
      </aside>
    </div>
  );
}
