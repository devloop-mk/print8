'use client';

import { useLayoutEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { PromoCatalogProduct } from '@/lib/catalog/promo-catalog';
import { PromoPriceTable } from '@/components/catalog/promo-flipbook/PromoPriceTable';
import { fitPromoProductText } from '@/components/catalog/promo-flipbook/fitPromoProductText';

export function PromoProductCard({
  product,
  name,
  specs,
  qty100Label,
}: {
  product: PromoCatalogProduct;
  name: string;
  specs: string[];
  qty100Label: string;
}) {
  const cardRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (cardRef.current) fitPromoProductText(cardRef.current);
  }, [name, specs]);

  return (
    <article ref={cardRef} className="promo-product-card">
      <Link href={product.href} className="promo-product-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={name} />
      </Link>
      <PromoPriceTable prices={product.prices} qty100Label={qty100Label} />
      <div className="promo-product-meta">
        <Link href={product.href} className="promo-product-title-link">
          <h3 className="promo-product-title font-display">{name}</h3>
        </Link>
        <div className="promo-product-specs">
          {specs.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="promo-product-swatches">
          {product.swatches?.map((color) => (
            <span
              key={color}
              className="promo-product-swatch"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
