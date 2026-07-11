'use client';

import { useEffect, useState } from 'react';
import {
  getProductDesignTemplate,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';

export function useMergedProductDesignTemplate(
  id: string | null | undefined,
): ProductDesignTemplate | null {
  const staticTemplate = id ? getProductDesignTemplate(id) ?? null : null;
  const [template, setTemplate] = useState<ProductDesignTemplate | null>(
    staticTemplate,
  );

  useEffect(() => {
    if (!id) {
      setTemplate(null);
      return;
    }

    let cancelled = false;
    const fallback = getProductDesignTemplate(id) ?? null;
    setTemplate(fallback);

    void fetch(`/api/catalog/product-designs/${encodeURIComponent(id)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { template?: ProductDesignTemplate } | null) => {
        if (!cancelled && data?.template) {
          setTemplate(data.template);
        }
      })
      .catch(() => {
        if (!cancelled) setTemplate(fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return template;
}
