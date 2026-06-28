'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createCatalogSearchLabels } from '@/lib/catalog/catalog-search';

export function useCatalogSearchLabels() {
  const tDesigns = useTranslations('designs');
  const tProducts = useTranslations('products');
  const tNavCategories = useTranslations('nav.productsMenu.categories');
  const tSearch = useTranslations('search');

  return useMemo(
    () =>
      createCatalogSearchLabels({
        tDesigns,
        tProducts,
        tNavCategories,
        tSearch,
      }),
    [tDesigns, tNavCategories, tProducts, tSearch],
  );
}
