import type { ProductType } from '@/lib/data/catalog';

export type BrandingPackProductType =
  | 't-shirt'
  | 'hoodie'
  | 'mug'
  | 'cap'
  | 'thermos'
  | 'bag';

export const BRANDING_PACK_PRODUCT_TYPES: BrandingPackProductType[] = [
  't-shirt',
  'hoodie',
  'mug',
  'cap',
  'thermos',
  'bag',
];

export const BRANDING_PACK_DEFAULT_PRODUCT_ID: Record<
  BrandingPackProductType,
  string
> = {
  't-shirt': 'tshirt-basic-white',
  hoodie: 'hoodie-basic',
  mug: 'mug-classic',
  cap: 'cap-classic',
  thermos: 'thermos-classic',
  bag: 'bag-tote',
};

export const BRANDING_PACK_DEFAULT_COLOR: Record<
  BrandingPackProductType,
  string
> = {
  't-shirt': '#ffffff',
  hoodie: '#1f2937',
  mug: '#ffffff',
  cap: '#1f2937',
  thermos: '#374151',
  bag: '#D8C3A5',
};

export type BrandingPackLogoPlacement = {
  scale: number;
  position: { x: number; y: number };
};

export const BRANDING_PACK_DEFAULT_LOGO_PLACEMENT: Record<
  BrandingPackProductType,
  BrandingPackLogoPlacement
> = {
  't-shirt': { scale: 34, position: { x: 50, y: 48 } },
  hoodie: { scale: 30, position: { x: 50, y: 56 } },
  mug: { scale: 26, position: { x: 50, y: 44 } },
  cap: { scale: 20, position: { x: 50, y: 40 } },
  thermos: { scale: 24, position: { x: 50, y: 42 } },
  bag: { scale: 32, position: { x: 50, y: 50 } },
};

export function isBrandingPackProductType(
  type: ProductType,
): type is BrandingPackProductType {
  return (BRANDING_PACK_PRODUCT_TYPES as readonly string[]).includes(type);
}
