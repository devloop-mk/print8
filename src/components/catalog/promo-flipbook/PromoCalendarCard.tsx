'use client';

import { useLayoutEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { PromoCatalogProduct } from '@/lib/catalog/promo-catalog';
import { PromoPriceTable } from '@/components/catalog/promo-flipbook/PromoPriceTable';
import { fitPromoProductText } from '@/components/catalog/promo-flipbook/fitPromoProductText';

export function PromoCalendarCard({
  product,
  name,
  specs,
  layout,
}: {
  product: PromoCatalogProduct;
  name: string;
  specs: string[];
  layout: 'one' | 'two';
}) {
  const cardRef = useRef<HTMLElement>(null);
  const extras = product.images ?? [];

  useLayoutEffect(() => {
    if (cardRef.current) fitPromoProductText(cardRef.current);
  }, [name, specs, layout]);

  return (
    <article
      ref={cardRef}
      className={`promo-cal promo-cal--${layout}${extras.length ? '' : ' promo-cal--solo'}`}
    >
      <Link href={product.href} className="promo-cal-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={name} />
      </Link>
      {extras.length > 0 ? (
        <div className={`promo-cal-thumbs promo-cal-thumbs--${extras.length}`}>
          {extras.map((src) => (
            <div key={src} className="promo-cal-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="promo-cal-meta">
        <PromoPriceTable prices={product.prices} />
        <div className="promo-product-meta">
          <Link href={product.href} className="promo-product-title-link">
            <h3 className="promo-product-title font-display">{name}</h3>
          </Link>
          <div className="promo-product-specs">
            {specs.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
