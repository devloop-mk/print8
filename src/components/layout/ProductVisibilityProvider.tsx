'use client';

import { createContext, useContext } from 'react';
import type { ProductType } from '@/lib/data/catalog';

const ProductVisibilityContext = createContext<ProductType[] | null>(null);

export function ProductVisibilityProvider({
  visibleProductTypes,
  children,
}: {
  visibleProductTypes: ProductType[];
  children: React.ReactNode;
}) {
  return (
    <ProductVisibilityContext.Provider value={visibleProductTypes}>
      {children}
    </ProductVisibilityContext.Provider>
  );
}

export function useVisibleProductTypes(): ProductType[] | null {
  return useContext(ProductVisibilityContext);
}
