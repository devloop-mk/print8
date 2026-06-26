'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductType } from '@/lib/data/catalog';
import { getSuggestedProductsForType } from '@/lib/products/product-nav';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { Reveal } from '@/components/motion/Reveal';

export function ProductTypeSuggestions({ type }: { type: ProductType }) {
  const t = useTranslations('products.typePages');
  const suggestions = useMemo(
    () => getSuggestedProductsForType(type),
    [type],
  );

  if (suggestions.length === 0) return null;

  return (
    <Reveal delay={120}>
      <section className="border-t border-ink-100 pt-10 sm:pt-12">
        <div className="mb-6 max-w-2xl sm:mb-8">
          <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">
            {t('suggestionsTitle')}
          </h2>
          <p className="mt-2 text-sm text-ink-600 sm:text-base">
            {t('suggestionsSubtitle')}
          </p>
        </div>
        <ProductCardGrid
          items={suggestions}
          gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        />
      </section>
    </Reveal>
  );
}
