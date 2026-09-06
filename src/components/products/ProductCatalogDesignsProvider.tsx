'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';

type ProductCatalogDesignsContextValue = {
  templatesByProductId: Record<string, ProductDesignTemplate[]>;
  loading: boolean;
};

const ProductCatalogDesignsContext =
  createContext<ProductCatalogDesignsContextValue | null>(null);

export function ProductCatalogDesignsProvider({
  productIds,
  children,
}: {
  productIds: string[];
  children: ReactNode;
}) {
  const [templatesByProductId, setTemplatesByProductId] = useState<
    Record<string, ProductDesignTemplate[]>
  >({});
  const [loading, setLoading] = useState(productIds.length > 0);

  const idsKey = useMemo(
    () => [...new Set(productIds)].sort().join(','),
    [productIds],
  );

  useEffect(() => {
    if (!idsKey) {
      setTemplatesByProductId({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/catalog/product-designs/for-products?ids=${encodeURIComponent(idsKey)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load design placements');
        return response.json() as Promise<{
          byProduct: Record<string, ProductDesignTemplate[]>;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setTemplatesByProductId(data.byProduct ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setTemplatesByProductId({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const value = useMemo(
    () => ({ templatesByProductId, loading }),
    [loading, templatesByProductId],
  );

  return (
    <ProductCatalogDesignsContext.Provider value={value}>
      {children}
    </ProductCatalogDesignsContext.Provider>
  );
}

export function useProductCatalogDesignTemplates(productId: string) {
  const context = useContext(ProductCatalogDesignsContext);
  return context?.templatesByProductId[productId];
}
