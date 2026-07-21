'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { resolveStaticProductDesignTemplate } from '@/lib/products/resolve-product-design-template';

export type MergedProductDesignTemplateState = {
  template: ProductDesignTemplate | null;
  /**
   * True once the client fetch has settled (success or failure), or when an
   * SSR `initialTemplate` is already authoritative. Customizer must wait for
   * this before seeding overlay placement so admin scale/position is applied.
   */
  isResolved: boolean;
};

export function useMergedProductDesignTemplateQuery(
  id: string | null | undefined,
  initialTemplate?: ProductDesignTemplate | null,
): MergedProductDesignTemplateState {
  const staticTemplate = id ? resolveStaticProductDesignTemplate(id) : null;
  const hasAuthoritativeInitial = Boolean(
    initialTemplate && (!id || initialTemplate.id === id),
  );
  const [template, setTemplate] = useState<ProductDesignTemplate | null>(
    () => initialTemplate ?? staticTemplate,
  );
  const [isResolved, setIsResolved] = useState(
    () => !id || hasAuthoritativeInitial,
  );

  // Callers often pass a freshly built object each render (e.g. partnerDesignToTemplate).
  // Keep it in a ref so the fetch effect only re-runs when `id` changes.
  const initialTemplateRef = useRef(initialTemplate);
  initialTemplateRef.current = initialTemplate;

  useEffect(() => {
    if (!id) {
      setTemplate(null);
      setIsResolved(true);
      return;
    }

    let cancelled = false;
    const fallback =
      initialTemplateRef.current ?? resolveStaticProductDesignTemplate(id);
    const authoritativeInitial =
      initialTemplateRef.current?.id === id ? initialTemplateRef.current : null;

    // Prefer the current/SSR template when the id already matches — never flash
    // back to static defaults while the client fetch is in flight.
    setTemplate((prev) => (prev?.id === id ? prev : fallback));
    // SSR/admin-resolved initial is trusted for first paint; otherwise wait for
    // the catalog fetch so we don't seed the customizer from static defaults.
    setIsResolved(Boolean(authoritativeInitial));

    void fetch(`/api/catalog/product-designs/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { template?: ProductDesignTemplate } | null) => {
        if (cancelled) return;
        if (data?.template) {
          setTemplate(data.template);
        } else if (fallback) {
          setTemplate(fallback);
        }
        setIsResolved(true);
      })
      .catch(() => {
        if (cancelled) return;
        setTemplate(fallback);
        setIsResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { template, isResolved };
}

export function useMergedProductDesignTemplate(
  id: string | null | undefined,
  initialTemplate?: ProductDesignTemplate | null,
): ProductDesignTemplate | null {
  return useMergedProductDesignTemplateQuery(id, initialTemplate).template;
}
