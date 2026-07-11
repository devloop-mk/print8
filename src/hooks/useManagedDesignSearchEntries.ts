'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import type { SearchableDesign } from '@/lib/catalog/catalog-search';

type PublishedDesignResponse = {
  designs: Array<{
    id: string;
    category: SearchableDesign['category'];
    kind: SearchableDesign['kind'];
    image: string;
    tags: string[];
    thumbAspect?: number;
    svgTemplateId?: string;
    layoutId?: string;
    nameEn?: string;
    nameMk?: string;
    exclusive?: boolean;
  }>;
};

export function useManagedDesignSearchEntries() {
  const locale = useLocale();
  const [designs, setDesigns] = useState<SearchableDesign[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/catalog/published-designs')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: PublishedDesignResponse | null) => {
        if (cancelled || !data) return;
        setDesigns(
          data.designs.map((design) => ({
            ...design,
            displayName:
              locale === 'mk'
                ? (design.nameMk ?? design.nameEn ?? design.id)
                : (design.nameEn ?? design.nameMk ?? design.id),
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setDesigns([]);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => designs, [designs]);
}
