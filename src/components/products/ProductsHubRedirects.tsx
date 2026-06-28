'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { productTypes } from '@/lib/data/catalog';
import { productTypeHref } from '@/lib/products/product-nav';
import type { ProductType } from '@/lib/data/catalog';

function isProductType(value: string): value is ProductType {
  return (productTypes as readonly string[]).includes(value);
}

export function ProductsHubRedirects() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && isProductType(typeParam)) {
      router.replace(productTypeHref(typeParam));
    }
  }, [router, searchParams]);

  return null;
}
