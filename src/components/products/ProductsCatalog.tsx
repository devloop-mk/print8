'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { products, productTypes } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';

export function ProductsCatalog() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );

  useEffect(() => {
    setTypeFilter(parseProductTypeFilter(searchParams.get('type')));
  }, [searchParams]);

  const filtered =
    typeFilter === 'all'
      ? products
      : products.filter((p) => p.type === typeFilter);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            typeFilter === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          All
        </button>
        {productTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              typeFilter === type
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {t(`types.${type}`)}
          </button>
        ))}
      </div>

      <ProductCardGrid items={filtered} />
    </>
  );
}
