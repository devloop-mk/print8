'use client';

import { useLayoutEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import {
  isPromoShopHref,
  type PromoCatalogProduct,
} from '@/lib/catalog/promo-catalog';
import { PromoPriceTable } from '@/components/catalog/promo-flipbook/PromoPriceTable';
import { fitPromoProductText } from '@/components/catalog/promo-flipbook/fitPromoProductText';

export function PromoProductTitle({
  name,
  href,
}: {
  name: string;
  href?: string;
}) {
  const title = <h3 className="promo-product-title font-display">{name}</h3>;
  if (isPromoShopHref(href)) {
    return (
      <Link href={href} className="promo-product-title-link">
        {title}
      </Link>
    );
  }
  return <div className="promo-product-title-link">{title}</div>;
}

export function PromoProductCard({
  product,
  name,
  specs,
}: {
  product: PromoCatalogProduct;
  name: string;
  specs: string[];
}) {
  const cardRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (cardRef.current) fitPromoProductText(cardRef.current);
  }, [name, specs]);

  return (
    <article ref={cardRef} className="promo-product-card">
      <div className="promo-product-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={name} />
      </div>
      <PromoPriceTable prices={product.prices} />
      <div className="promo-product-meta">
        <PromoProductTitle name={name} href={product.href} />
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
