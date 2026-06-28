'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search, X } from 'lucide-react';
import { searchGlobalCatalog } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  SearchCollectionsSection,
  SearchDesignsSection,
  SearchProductDesignsSection,
  SearchProductsSection,
} from '@/components/search/search-result-ui';
import { cn } from '@/lib/utils';

type GlobalSearchProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const labels = useCatalogSearchLabels();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 350);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const results = useMemo(
    () => searchGlobalCatalog(debouncedQuery, labels).slice(0, 12),
    [debouncedQuery, labels],
  );

  const grouped = useMemo(() => {
    return {
      collection: results.filter((item) => item.kind === 'collection'),
      design: results.filter((item) => item.kind === 'design'),
      product: results.filter((item) => item.kind === 'product'),
      productDesign: results.filter((item) => item.kind === 'product-design'),
    };
  }, [results]);

  const isSettled = query.trim() === debouncedQuery.trim();

  if (!open) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-950/50 p-4 pt-[10vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t('close')}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="border-b border-ink-100 p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('ariaLabel')}
              className="w-full rounded-xl border border-ink-200 py-3 pl-11 pr-11 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
          {!query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-ink-500">{t('startTyping')}</p>
          ) : !isSettled && results.length === 0 ? (
            <div className="py-8" aria-hidden />
          ) : isSettled && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-500">
              {t('noResults', { query: debouncedQuery.trim() })}
            </p>
          ) : (
            <div className="space-y-4 p-2">
              <SearchCollectionsSection
                items={grouped.collection}
                compact
                onSelect={onClose}
              />
              <SearchDesignsSection
                items={grouped.design}
                compact
                onSelect={onClose}
              />
              <SearchProductsSection
                items={grouped.product}
                compact
                onSelect={onClose}
              />
              <SearchProductDesignsSection
                items={grouped.productDesign}
                compact
                onSelect={onClose}
              />
            </div>
          )}
        </div>

        {query.trim() && results.length > 0 ? (
          <div className="border-t border-ink-100 p-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              {t('viewAll')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GlobalSearchButton({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) {
  const t = useTranslations('search');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50',
        className,
      )}
      aria-label={t('open')}
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      <span className="hidden xl:inline text-sm font-medium">{t('open')}</span>
    </button>
  );
}
