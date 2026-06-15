'use client';

import {
  getProductMockup,
  type Product,
  type ProductDesignTemplate,
  type ProductDesignTextStyle,
} from '@/lib/data/catalog';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import { Shirt } from 'lucide-react';

export function StyledDesignText({
  style,
  className = '',
}: {
  style: ProductDesignTextStyle;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute select-none text-center font-bold leading-tight ${className}`}
      style={{
        color: style.textColor,
        left: `${style.textPosition.x}%`,
        top: `${style.textPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${style.textSize}px`,
        fontWeight: style.fontWeight ?? 700,
        letterSpacing: style.letterSpacing ?? '0.02em',
        lineHeight: style.lineHeight ?? 1.2,
        textShadow:
          style.textShadow ??
          '0 1px 2px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.15)',
        whiteSpace: 'pre-line',
        maxWidth: '78%',
      }}
    >
      {style.text}
    </div>
  );
}

export function DesignTemplatePreview({
  product,
  color,
  design,
  typeLabel,
  showPhotoGuide = false,
}: {
  product: Product;
  color: string;
  design: ProductDesignTemplate;
  typeLabel: string;
  showPhotoGuide?: boolean;
}) {
  const mockup = getProductMockup(product, color, design.defaultSide);
  const textStyle = design.textStyle;
  const photoGuide = textStyle?.photoPosition;

  return (
    <ProductMockupFrame className="bg-gradient-to-br from-brand-50 to-brand-100 shadow-none">
      {mockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mockup}
          alt={typeLabel}
          draggable={false}
          className="pointer-events-none h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Shirt className="h-16 w-16 text-brand-300" />
        </div>
      )}

      {textStyle && <StyledDesignText style={textStyle} />}

      {showPhotoGuide && photoGuide && (
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full border-2 border-dashed border-brand-400/60 bg-brand-100/30"
          style={{
            left: `${photoGuide.x}%`,
            top: `${photoGuide.y}%`,
            width: `${textStyle?.photoScale ?? 36}%`,
            aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </ProductMockupFrame>
  );
}
