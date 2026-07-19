'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { resolveStaticProductDesignTemplate } from '@/lib/products/resolve-product-design-template';

export function useMergedProductDesignTemplate(
  id: string | null | undefined,
  initialTemplate?: ProductDesignTemplate | null,
): ProductDesignTemplate | null {
  const staticTemplate = id ? resolveStaticProductDesignTemplate(id) : null;
  const [template, setTemplate] = useState<ProductDesignTemplate | null>(
    () => initialTemplate ?? staticTemplate,
  );

  // Callers often pass a freshly built object each render (e.g. partnerDesignToTemplate).
  // Keep it in a ref so the fetch effect only re-runs when `id` changes.
  const initialTemplateRef = useRef(initialTemplate);
  initialTemplateRef.current = initialTemplate;

  useEffect(() => {
    if (!id) {
      setTemplate(null);
      return;
    }

    let cancelled = false;
    const fallback =
      initialTemplateRef.current ?? resolveStaticProductDesignTemplate(id);

    // Prefer the current/SSR template when the id already matches — never flash
    // back to static defaults while the client fetch is in flight.
    setTemplate((prev) => (prev?.id === id ? prev : fallback));

    void fetch(`/api/catalog/product-designs/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    })
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
