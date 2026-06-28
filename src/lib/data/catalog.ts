export type ServiceId =
  | 'business-cards'
  | 'restaurant-menus'
  | 'laminating'
  | 'color-bw-printing'
  | 'plastification'
  | 't-shirt-printing'
  | 'hoodie-printing'
  | 'bodysuit-printing'
  | 'cap-printing'
  | 'cup-printing'
  | 'bag-printing'
  | 'thermos-printing'
  | 'magnet-printing'
  | 'promotional-items'
  | 'wooden-plaques'
  | 'photo-stone'
  | 'bookbinding'
  | 'thesis-hardcover'
  | 'wedding-invitations'
  | 'birthday-invitations'
  | 'thank-you-cards'
  | 'gift-sets'
  | 'club-membership-cards'
  | 'loyalty-points-cards'
  | 'temporary-tattoos'
  | 'tattoo-services';

export const serviceCategoryOrder = [
  'merch',
  'gifts',
  'print',
  'finishing',
  'special',
] as const;

export type ServiceCategoryId = (typeof serviceCategoryOrder)[number];

export type ServiceCustomization = 'none' | 'designs' | 'products';

export interface Service {
  id: ServiceId;
  icon: string;
  category: ServiceCategoryId;
  startingPrice: number;
  featured?: boolean;
  /** Link to contact instead of add-to-cart */
  contactOnly?: boolean;
  /** Whether the service has design/product options on its detail page */
  customization: ServiceCustomization;
  designCategory?: DesignCategory;
  productTypes?: ProductType[];
}

export const services: Service[] = [
  {
    id: 't-shirt-printing',
    icon: 'Shirt',
    category: 'merch',
    startingPrice: 600,
    featured: true,
    customization: 'products',
    productTypes: ['t-shirt'],
  },
  {
    id: 'hoodie-printing',
    icon: 'Shirt',
    category: 'merch',
    startingPrice: 1200,
    featured: true,
    customization: 'products',
    productTypes: ['hoodie'],
  },
  {
    id: 'bodysuit-printing',
    icon: 'Baby',
    category: 'merch',
    startingPrice: 500,
    featured: true,
    customization: 'products',
    productTypes: ['bodysuit'],
  },
  {
    id: 'cap-printing',
    icon: 'CircleUserRound',
    category: 'merch',
    startingPrice: 500,
    customization: 'products',
    productTypes: ['cap'],
  },
  {
    id: 'bag-printing',
    icon: 'ShoppingBag',
    category: 'merch',
    startingPrice: 300,
    featured: true,
    customization: 'products',
    productTypes: ['bag'],
  },
  {
    id: 'cup-printing',
    icon: 'Coffee',
    category: 'merch',
    startingPrice: 250,
    customization: 'products',
    productTypes: ['mug', 'cup'],
  },
  {
    id: 'thermos-printing',
    icon: 'GlassWater',
    category: 'merch',
    startingPrice: 800,
    featured: true,
    customization: 'products',
    productTypes: ['thermos'],
  },
  {
    id: 'magnet-printing',
    icon: 'Magnet',
    category: 'gifts',
    startingPrice: 49,
    featured: true,
    customization: 'products',
    productTypes: ['magnet'],
  },
  {
    id: 'promotional-items',
    icon: 'KeyRound',
    category: 'gifts',
    startingPrice: 200,
    customization: 'none',
  },
  {
    id: 'wooden-plaques',
    icon: 'Award',
    category: 'gifts',
    startingPrice: 900,
    customization: 'none',
  },
  {
    id: 'photo-stone',
    icon: 'Gem',
    category: 'gifts',
    startingPrice: 1200,
    customization: 'none',
  },
  {
    id: 'gift-sets',
    icon: 'Gift',
    category: 'gifts',
    startingPrice: 1200,
    customization: 'products',
    productTypes: ['gift-set'],
  },
  {
    id: 'business-cards',
    icon: 'CreditCard',
    category: 'print',
    startingPrice: 500,
    featured: true,
    customization: 'designs',
    designCategory: 'business-cards',
  },
  {
    id: 'restaurant-menus',
    icon: 'BookOpen',
    category: 'print',
    startingPrice: 800,
    customization: 'designs',
    designCategory: 'menus',
  },
  {
    id: 'wedding-invitations',
    icon: 'ScrollText',
    category: 'print',
    startingPrice: 1500,
    featured: true,
    customization: 'designs',
    designCategory: 'wedding',
  },
  {
    id: 'birthday-invitations',
    icon: 'PartyPopper',
    category: 'print',
    startingPrice: 800,
    customization: 'designs',
    designCategory: 'birthday',
  },
  {
    id: 'thank-you-cards',
    icon: 'Mail',
    category: 'print',
    startingPrice: 600,
    customization: 'none',
  },
  {
    id: 'color-bw-printing',
    icon: 'Printer',
    category: 'print',
    startingPrice: 10,
    featured: true,
    customization: 'none',
  },
  {
    id: 'club-membership-cards',
    icon: 'IdCard',
    category: 'print',
    startingPrice: 400,
    customization: 'none',
  },
  {
    id: 'loyalty-points-cards',
    icon: 'BadgePercent',
    category: 'print',
    startingPrice: 350,
    customization: 'none',
  },
  {
    id: 'laminating',
    icon: 'Layers',
    category: 'finishing',
    startingPrice: 50,
    customization: 'none',
  },
  {
    id: 'plastification',
    icon: 'Shield',
    category: 'finishing',
    startingPrice: 100,
    customization: 'none',
  },
  {
    id: 'bookbinding',
    icon: 'BookMarked',
    category: 'finishing',
    startingPrice: 400,
    featured: true,
    customization: 'none',
  },
  {
    id: 'thesis-hardcover',
    icon: 'GraduationCap',
    category: 'finishing',
    startingPrice: 1500,
    featured: true,
    customization: 'none',
  },
  {
    id: 'temporary-tattoos',
    icon: 'Sticker',
    category: 'special',
    startingPrice: 300,
    customization: 'none',
  },
  {
    id: 'tattoo-services',
    icon: 'PenTool',
    category: 'special',
    startingPrice: 0,
    contactOnly: true,
    customization: 'none',
  },
];

export type DesignCategory =
  | 'business-cards'
  | 'wedding'
  | 'birthday'
  | 'menus'
  | 'general';

export type DesignTemplateKind = 'fixed' | 'customizable';

export interface DesignTemplate {
  id: string;
  category: DesignCategory;
  image: string;
  tags: string[];
  kind: DesignTemplateKind;
  layoutId?: string;
  /** Raw SVG template from `public/NEW_DESIGNS` with editable text & colors */
  svgTemplateId?: string;
}

export const designTemplates: DesignTemplate[] = [
  {
    id: 'svg-bcard-tech-wave',
    category: 'business-cards',
    image: '/NEW_DESIGNS/business card/bcard-tech-wave-front.svg',
    tags: ['modern', 'tech', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bcard-tech-wave',
  },
  {
    id: 'svg-bcard-luxury-gold',
    category: 'business-cards',
    image: '/NEW_DESIGNS/business card/bcard-luxury-gold-front.svg',
    tags: ['luxury', 'gold', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bcard-luxury-gold',
  },
  {
    id: 'svg-bcard-corporate-geo',
    category: 'business-cards',
    image: '/NEW_DESIGNS/business card/bcard-corporate-geo-front.svg',
    tags: ['corporate', 'professional', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bcard-corporate-geo',
  },
  {
    id: 'svg-bcard-creative-abstract',
    category: 'business-cards',
    image: '/NEW_DESIGNS/business card/bcard-creative-abstract-front.svg',
    tags: ['creative', 'abstract', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bcard-creative-abstract',
  },
  {
    id: 'svg-wedding-modern-arch',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-modern-arch.svg',
    tags: ['modern', 'minimal', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-modern-arch',
  },
  {
    id: 'svg-wedding-romantic-blush',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-romantic-blush.svg',
    tags: ['romantic', 'blush', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-romantic-blush',
  },
  {
    id: 'svg-wedding-classic-navy-gold',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-classic-navy-gold.svg',
    tags: ['classic', 'navy', 'gold', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-classic-navy-gold',
  },
  {
    id: 'svg-wedding-botanical-boho',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-botanical-boho.svg',
    tags: ['botanical', 'boho', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-botanical-boho',
  },
  {
    id: 'svg-wedding-print-beach',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-beach.svg',
    tags: ['beach', 'coastal', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-beach',
  },
  {
    id: 'svg-wedding-print-autumn',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-autumn.svg',
    tags: ['autumn', 'rustic', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-autumn',
  },
  {
    id: 'svg-wedding-print-celestial',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-celestial.svg',
    tags: ['celestial', 'stars', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-celestial',
  },
  {
    id: 'svg-wedding-print-terracotta',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-terracotta.svg',
    tags: ['terracotta', 'desert', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-terracotta',
  },
  {
    id: 'svg-wedding-print-watercolor',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-watercolor.svg',
    tags: ['watercolor', 'garden', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-watercolor',
  },
  {
    id: 'svg-wedding-print-winter',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-print-winter.svg',
    tags: ['winter', 'snow', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-print-winter',
  },
  {
    id: 'svg-bday-gold',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-gold.svg',
    tags: ['gold', 'elegant', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-gold',
  },
  {
    id: 'svg-bday-rosegold',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-rosegold.svg',
    tags: ['rose-gold', 'elegant', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-rosegold',
  },
  {
    id: 'svg-bday-princess',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-princess.svg',
    tags: ['princess', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-princess',
  },
  {
    id: 'svg-bday-dino',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-dino.svg',
    tags: ['dinosaur', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-dino',
  },
  {
    id: 'svg-bday-champagne',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-champagne.svg',
    tags: ['champagne', 'elegant', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-champagne',
  },
  {
    id: 'svg-bday-unicorn',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-unicorn.svg',
    tags: ['unicorn', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-unicorn',
  },
  {
    id: 'svg-bday-bbq',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-bbq.svg',
    tags: ['bbq', 'casual', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-bbq',
  },
  {
    id: 'svg-bday-retro',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-retro.svg',
    tags: ['retro', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-retro',
  },
  {
    id: 'svg-bday-construction',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-construction.svg',
    tags: ['construction', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-construction',
  },
  {
    id: 'svg-bday-mermaid',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-mermaid.svg',
    tags: ['mermaid', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-mermaid',
  },
  {
    id: 'svg-bday-safari',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-safari.svg',
    tags: ['safari', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-safari',
  },
  {
    id: 'svg-bday-space',
    category: 'birthday',
    image: '/NEW_DESIGNS/birthday/bday-print-space.svg',
    tags: ['space', 'kids', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-bday-space',
  },
  {
    id: 'svg-menu-rustic',
    category: 'menus',
    image: '/NEW_DESIGNS/menu-print-rustic-front.svg',
    tags: ['rustic', 'italian', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-menu-rustic',
  },
  {
    id: 'svg-menu-finedining',
    category: 'menus',
    image: '/NEW_DESIGNS/menu-print-finedining-front.svg',
    tags: ['fine-dining', 'steakhouse', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-menu-finedining',
  },
];

export type ProductType =
  | 't-shirt'
  | 'hoodie'
  | 'bodysuit'
  | 'cap'
  | 'mug'
  | 'cup'
  | 'bag'
  | 'thermos'
  | 'magnet'
  | 'gift-set';
export type ProductSide = 'front' | 'back' | 'left' | 'right';

export interface ProductSideImages {
  front: string;
  back: string;
  left?: string;
  right?: string;
}

/** Primary catalog mockup plus optional second angle / alternate view */
export interface ProductColorPair {
  primary: string;
  secondary?: string;
}

export type ProductColorImages = Record<
  string,
  string | ProductColorPair | ProductSideImages
>;

export type ProductGallerySlide = {
  image: string;
  /** Customization side — only for multi-side products */
  labelKey?: 'front' | 'back' | 'left' | 'right';
  kind: 'photo' | 'side';
};

export function productHasPhotoGallery(
  product: Product,
  color: string,
): boolean {
  const entry = product.colorsImages?.[color];
  return Boolean(
    entry &&
    typeof entry !== 'string' &&
    isProductColorPair(entry) &&
    entry.secondary,
  );
}

export function isProductColorPair(
  entry: string | ProductColorPair | ProductSideImages,
): entry is ProductColorPair {
  return typeof entry === 'object' && 'primary' in entry;
}

export function isProductSideImages(
  entry: string | ProductColorPair | ProductSideImages,
): entry is ProductSideImages {
  return typeof entry === 'object' && 'front' in entry && !('primary' in entry);
}

export interface Product {
  id: string;
  type: ProductType;
  /** Translation key under `products.items` — falls back to product type */
  nameKey?: string;
  image: string;
  basePrice: number;
  colors?: string[];
  colorsImages?: ProductColorImages;
  sizes?: string[];
  /** Products that support separate front/back customization */
  sides?: ProductSide[];
  /** Default crop aspect for upload-only products (e.g. magnets) */
  uploadAspect?: number;
}

export function isMagnetProduct(product: Product): boolean {
  return product.type === 'magnet';
}

export function getMagnetDisplayMockup(
  product: Product,
  color: string,
): string {
  const entry = product.colorsImages?.[color];
  if (entry && typeof entry !== 'string' && isProductColorPair(entry)) {
    return entry.secondary ?? entry.primary;
  }
  return getProductMockup(product, color, 'front');
}

export function getProductNameKey(product: Product): string {
  return product.nameKey ?? product.type;
}

export type ProductDesignKind = 'image' | 'text' | 'overlay';
export type ProductDesignCategory = 'image-designs' | 'text-designs';

export interface ProductDesignTextStyle {
  text: string;
  textColor: string;
  textSize: number;
  textPosition: { x: number; y: number };
  fontWeight?: 600 | 700 | 800;
  letterSpacing?: string;
  lineHeight?: number;
  textShadow?: string;
  /** Default slot for uploaded family/personal photo */
  photoPosition?: { x: number; y: number };
  photoScale?: number;
}

export interface ProductDesignTemplate {
  id: string;
  kind: ProductDesignKind;
  category: ProductDesignCategory;
  productTypes: ProductType[];
  productIds?: string[];
  nameKey: string;
  defaultSide: ProductSide;
  /** Full product JPEG — used for `image` kind thumbnails & customizer base */
  image?: string;
  /** Transparent print artwork (PNG) — overlaid on product mockup */
  overlayImage?: string;
  /** Recolorable SVG source (1–2 ink slots via CSS variables) */
  overlaySvg?: string;
  overlayRecolor?: {
    primary: string;
    secondary?: string;
    slots?: 1 | 2;
  };
  /** Fixed multi-color art — map shirt hex to tuned PNG/SVG variant */
  overlayColorVariants?: Record<string, string>;
  overlayScale?: number;
  overlayPosition?: { x: number; y: number };
  /** Recommended shirt color hex for this ink (e.g. cream on black) */
  recommendedColor?: string;
  /** Shirt colors this design supports — omit to infer from variants / contrast */
  applicableColors?: string[];
  /** Styled Macedonian text layout — used for `text` kind */
  textStyle?: ProductDesignTextStyle;
}

export const productDesignTemplates: ProductDesignTemplate[] = [
  {
    id: 'tee-design-1',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['t-shirt'],
    nameKey: 'design1',
    image: '/product-designs/tee-design-1.jpg',
    defaultSide: 'front',
  },
  {
    id: 'tee-design-2',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['t-shirt'],
    nameKey: 'design2',
    image: '/product-designs/tee-design-2.jpg',
    defaultSide: 'front',
  },
  {
    id: 'tee-design-3',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['t-shirt'],
    nameKey: 'design3',
    image: '/product-designs/tee-design-3.jpg',
    defaultSide: 'front',
  },
  {
    id: 'tee-back-design-1',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['t-shirt'],
    nameKey: 'backDesign1',
    image: '/product-designs/tee-back-design-1.jpg',
    defaultSide: 'back',
  },
  {
    id: 'tee-print-keep-working-out',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'printKeepWorkingOut',
    overlayImage: '/product-designs/prints/keep-working-out/on-black.png',
    overlayColorVariants: {
      '#000000': '/product-designs/prints/keep-working-out/on-black.png',
      '#1f2937': '/product-designs/prints/keep-working-out/on-black.png',
      '#ffffff': '/product-designs/prints/keep-working-out/on-white.png',
      '#1e40af': '/product-designs/prints/keep-working-out/on-blue.png',
      '#dc2626': '/product-designs/prints/keep-working-out/on-red.png',
    },
    overlayScale: 54,
    overlayPosition: { x: 50, y: 44 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-lift-heavy',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'printLiftHeavy',
    overlaySvg: '/product-designs/prints/recolor/lift-heavy.svg',
    overlayRecolor: { primary: '#F4EDE4', slots: 1 },
    overlayScale: 52,
    overlayPosition: { x: 50, y: 44 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-gym-alfa-mentalitet',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'gymAlfaMentalitet',
    overlayImage: '/NEW_DESIGNS/t-shirts/gym-alfa-mentalitet.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 49 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-gym-zver-gorilla',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'gymZverGorilla',
    overlayImage: '/NEW_DESIGNS/t-shirts/gym-zver-gorilla-v2.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 49 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-gym-posilen-od-vcera',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'gymPosilenOdVcera',
    overlayImage: '/NEW_DESIGNS/t-shirts/gym-posilen-od-vcera-v2.png',
    overlayScale: 49,
    overlayPosition: { x: 50, y: 54 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-gym-oslobodi-go-zverot',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'gymOslobodiGoZverot',
    overlayImage: '/NEW_DESIGNS/t-shirts/gym-oslobodi-go-zverot.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 47 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-baby-loading-boy',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'babyLoadingBoy',
    overlayImage: '/NEW_DESIGNS/t-shirts/baby-loading-boy.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 52 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-baby-loading-girl',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'babyLoadingGirl',
    overlayImage: '/NEW_DESIGNS/t-shirts/baby-loading-girl.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 52 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-baby-zipper-boy',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'babyZipperBoy',
    overlayImage: '/NEW_DESIGNS/t-shirts/baby-zipper-boy.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 68 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'tee-print-baby-zipper-girl',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'babyZipperGirl',
    overlayImage: '/NEW_DESIGNS/t-shirts/baby-zipper-girl.png',
    overlayScale: 52,
    overlayPosition: { x: 50, y: 68 },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },
  {
    id: 'bodysuit-print-vujko',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: 'bodysuitVujko',
    overlayImage: '/spikozni/dizajni/spikozna-dizajn-vujko-1.png',
    overlayScale: 36,
    overlayPosition: { x: 50, y: 49 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
  },
  {
    id: 'bodysuit-print-tato',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: 'bodysuitTato',
    overlayImage: '/spikozni/dizajni/spikozna-dizajn-tato-1.png',
    overlayScale: 32,
    overlayPosition: { x: 50, y: 48 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
  },
  {
    id: 'bodysuit-print-tetka',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: 'bodysuitTetka',
    overlayImage: '/spikozni/dizajni/spikozna-dizajn-tetka-1.png',
    overlayScale: 35,
    overlayPosition: { x: 50, y: 50 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
  },
  {
    id: 'bodysuit-print-babadedo',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: 'bodysuitBabaDedo',
    overlayImage: '/spikozni/dizajni/spikozna-dizajn-babadedo-1.png',
    overlayScale: 34,
    overlayPosition: { x: 50, y: 50 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
  },
  {
    id: 'bodysuit-print-mamatato',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: 'bodysuitMamaTato',
    overlayImage: '/spikozni/dizajni/spikozna-dizajn-mamatato-1.png',
    overlayScale: 34,
    overlayPosition: { x: 50, y: 49 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
  },
  {
    id: 'tee-text-family',
    kind: 'text',
    category: 'text-designs',
    productTypes: ['t-shirt'],
    nameKey: 'loveFamily',
    defaultSide: 'front',
    textStyle: {
      text: 'Го сакам\nмоето семејство',
      textColor: '#1e3a5f',
      textSize: 17,
      textPosition: { x: 50, y: 33 },
      fontWeight: 800,
      letterSpacing: '0.03em',
      lineHeight: 1.15,
      photoPosition: { x: 50, y: 47 },
      photoScale: 38,
    },
  },
  {
    id: 'tee-text-mother',
    kind: 'text',
    category: 'text-designs',
    productTypes: ['t-shirt'],
    nameKey: 'bestMother',
    defaultSide: 'front',
    textStyle: {
      text: 'Најдобрата\nмајка',
      textColor: '#9d174d',
      textSize: 20,
      textPosition: { x: 50, y: 34 },
      fontWeight: 800,
      letterSpacing: '0.02em',
      lineHeight: 1.1,
      photoPosition: { x: 50, y: 49 },
      photoScale: 36,
    },
  },
  {
    id: 'tee-text-father',
    kind: 'text',
    category: 'text-designs',
    productTypes: ['t-shirt'],
    nameKey: 'bestFather',
    defaultSide: 'front',
    textStyle: {
      text: 'Најдобриот\nтатко',
      textColor: '#1e40af',
      textSize: 20,
      textPosition: { x: 50, y: 34 },
      fontWeight: 800,
      letterSpacing: '0.02em',
      lineHeight: 1.1,
      photoPosition: { x: 50, y: 49 },
      photoScale: 36,
    },
  },
  {
    id: 'tee-text-macedonia',
    kind: 'text',
    category: 'text-designs',
    productTypes: ['t-shirt'],
    nameKey: 'loveMacedonia',
    defaultSide: 'front',
    textStyle: {
      text: 'Ја сакам\nМакедонија',
      textColor: '#fc0000',
      textSize: 19,
      textPosition: { x: 50, y: 34 },
      fontWeight: 800,
      letterSpacing: '0.05em',
      lineHeight: 1.12,
      photoPosition: { x: 50, y: 50 },
      photoScale: 34,
    },
  },
  {
    id: 'mug-design-1',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-classic'],
    nameKey: 'mugDesign1',
    image: '/product-designs/mug-design-1.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-design-coffee-bear',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-b5kf-white'],
    nameKey: 'mugCoffeeBear',
    image: '/mugs/design-coffee-bear.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-design-quality-organic',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-frosted'],
    nameKey: 'mugQualityOrganic',
    image: '/mugs/design-quality-organic.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-design-portrait-red',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-red-patch'],
    nameKey: 'mugPortraitRed',
    image: '/mugs/design-portrait-red.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-inside-daddy-design',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-inside-daddy'],
    nameKey: 'mugInsideDaddy',
    image: '/mugs/mug-inside-daddy.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-inside-love-design',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-inside-love'],
    nameKey: 'mugInsideLove',
    image: '/mugs/mug-inside-love.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-inside-birthday-design',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-inside-birthday'],
    nameKey: 'mugInsideBirthday',
    image: '/mugs/mug-inside-birthday.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-inside-mothers-day-design',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-inside-mothers-day'],
    nameKey: 'mugInsideMothersDay',
    image: '/mugs/mug-inside-mothers-day.jpg',
    defaultSide: 'front',
  },
  {
    id: 'mug-inside-thanksgiving-design',
    kind: 'image',
    category: 'image-designs',
    productTypes: ['mug'],
    productIds: ['mug-inside-thanksgiving'],
    nameKey: 'mugInsideThanksgiving',
    image: '/mugs/mug-inside-thanksgiving.jpg',
    defaultSide: 'front',
  },
];

export function getProductDesignTemplatesByCategory(
  product: Product,
  category: ProductDesignCategory,
) {
  return getProductDesignTemplates(product).filter(
    (d) => d.category === category,
  );
}

export function isImageDesignTemplate(d: ProductDesignTemplate) {
  return d.kind === 'image' && Boolean(d.image);
}

export function isRecolorableOverlayTemplate(d: ProductDesignTemplate) {
  return Boolean(d.overlaySvg && d.overlayRecolor);
}

export function isOverlayDesignTemplate(d: ProductDesignTemplate) {
  return (
    d.kind === 'overlay' &&
    Boolean(d.overlayImage || d.overlaySvg || d.overlayColorVariants)
  );
}

export function isTextDesignTemplate(d: ProductDesignTemplate) {
  return d.kind === 'text' && Boolean(d.textStyle);
}

export function productSupportsSides(product: Product): boolean {
  return (product.sides?.length ?? 0) > 1;
}

export function getProductSides(product: Product): ProductSide[] {
  if (product.sides?.length) return product.sides;
  if (
    product.type === 't-shirt' ||
    product.type === 'hoodie' ||
    product.type === 'bag'
  ) {
    return ['front', 'back'];
  }
  if (product.type === 'cap') {
    return ['front', 'back', 'left', 'right'];
  }
  return ['front'];
}

function mockupPathForSide(basePath: string, side: ProductSide): string {
  if (side === 'front') return basePath;
  return basePath.replace(/(\.[a-z]+)$/i, `-${side}$1`);
}

export function getProductMockup(
  product: Product,
  color: string,
  side: ProductSide,
): string {
  const entry = product.colorsImages?.[color];
  if (!entry) return product.image;
  if (typeof entry === 'string') {
    return mockupPathForSide(entry, side);
  }
  if (isProductColorPair(entry)) {
    return entry.primary;
  }

  const bySide: Partial<Record<ProductSide, string | undefined>> = {
    front: entry.front,
    back: entry.back,
    left: entry.left,
    right: entry.right,
  };

  return bySide[side] ?? entry.front;
}

export function getProductGallerySlides(
  product: Product,
  color: string,
): ProductGallerySlide[] {
  const entry = product.colorsImages?.[color];

  if (entry && typeof entry !== 'string' && isProductColorPair(entry)) {
    const slides: ProductGallerySlide[] = [
      { image: entry.primary, kind: 'photo' },
    ];
    if (entry.secondary) {
      slides.push({ image: entry.secondary, kind: 'photo' });
    }
    return slides;
  }

  if (productSupportsSides(product) && (product.sides?.length ?? 0) > 1) {
    return getProductSides(product).map((side) => ({
      image: getProductMockup(product, color, side),
      kind: 'side' as const,
      labelKey:
        side === 'front'
          ? 'front'
          : side === 'back'
            ? 'back'
            : side === 'left'
              ? 'left'
              : 'right',
    }));
  }

  const image = getProductMockup(product, color, 'front');
  return image ? [{ image, kind: 'photo' as const }] : [];
}

export function getProductSecondaryImage(
  product: Product,
  color: string,
): string | null {
  const slides = getProductGallerySlides(product, color);
  return slides.length > 1 ? slides[1].image : null;
}

export function getProductDesignTemplates(product: Product) {
  return productDesignTemplates.filter(
    (d) =>
      d.productTypes.includes(product.type) &&
      (!d.productIds || d.productIds.includes(product.id)),
  );
}

export function getProductDesignTemplate(id: string) {
  return productDesignTemplates.find((d) => d.id === id);
}

export function getDesignTemplate(id: string) {
  return designTemplates.find((d) => d.id === id);
}

export function getDesignHref(design: DesignTemplate) {
  return design.kind === 'customizable'
    ? `/designs/${design.id}/customize`
    : `/designs/${design.id}`;
}

export function isCustomizableDesign(template: DesignTemplate) {
  return (
    template.kind === 'customizable' &&
    Boolean(template.layoutId || template.svgTemplateId)
  );
}

export function getService(id: string) {
  return services.find((s) => s.id === id);
}

export function getFeaturedServices() {
  return services.filter((service) => service.featured);
}

export function getServicesByCategory() {
  return serviceCategoryOrder.map((category) => ({
    category,
    services: services.filter((service) => service.category === category),
  }));
}

export function serviceHasDetailOptions(service: Service) {
  return service.customization !== 'none';
}

export function getDesignsForService(service: Service) {
  if (service.customization !== 'designs' || !service.designCategory) return [];
  return designTemplates.filter((d) => d.category === service.designCategory);
}

export function getProductsForService(service: Service) {
  if (service.customization !== 'products' || !service.productTypes?.length) {
    return [];
  }
  return products.filter((p) => service.productTypes!.includes(p.type));
}

export const products: Product[] = [
  {
    id: 'tshirt-basic-white',
    type: 't-shirt',
    image: '/t-shirts/tshirt-white.jpg',
    colorsImages: {
      '#ffffff': {
        front: '/t-shirts/tshirt-white.jpg',
        back: '/t-shirts/tshirt-white-back.jpg',
      },
      '#000000': {
        front: '/t-shirts/tshirt-black.jpg',
        back: '/t-shirts/tshirt-black-back.jpg',
      },
      '#1e40af': {
        front: '/t-shirts/tshirt-blue.jpg',
        back: '/t-shirts/tshirt-blue-back.jpg',
      },
      '#dc2626': {
        front: '/t-shirts/tshirt-red.jpg',
        back: '/t-shirts/tshirt-red-back.jpg',
      },
    },
    basePrice: 600,
    colors: ['#ffffff', '#000000', '#1e40af', '#dc2626'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sides: ['front', 'back'],
  },
  {
    id: 'bodysuit-basic',
    type: 'bodysuit',
    nameKey: 'bodysuitBasic',
    image: '/spikozni/mockup-bodysuit-white.png',
    colorsImages: {
      '#ffffff': '/spikozni/mockup-bodysuit-white.png',
      '#7eb8da': '/spikozni/mockup-bodysuit-blue.png',
    },
    basePrice: 500,
    colors: ['#ffffff', '#7eb8da'],
    sizes: ['0-3', '3-6', '6-9', '9-12', '12-18'],
  },
  {
    id: 'mug-classic',
    type: 'mug',
    nameKey: 'mugClassic',
    image: '/mugs/mug-milkyblue.jpg',
    colorsImages: {
      '#ffffff': '/mugs/mug-white-classic.jpg',
      '#ADD8E6': '/mugs/mug-milkyblue.jpg',
      '#000000': '/mugs/mug-black.jpg',
    },
    basePrice: 250,
    colors: ['#ffffff', '#ADD8E6', '#000000'],
  },
  {
    id: 'mug-heart-handle',
    type: 'mug',
    nameKey: 'mugHeartHandle',
    image: '/mugs/mug-heart-handle.jpg',
    colorsImages: {
      '#ffffff': '/mugs/mug-heart-handle.jpg',
    },
    basePrice: 280,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-chrome-handle',
    type: 'mug',
    nameKey: 'mugChromeHandle',
    image: '/mugs/mug-chrome-handle.png',
    colorsImages: {
      '#ffffff': '/mugs/mug-chrome-handle.png',
    },
    basePrice: 300,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-gold-handle',
    type: 'mug',
    nameKey: 'mugGoldHandle',
    image: '/mugs/mug-gold-handle.jpg',
    colorsImages: {
      '#ffffff': '/mugs/mug-gold-handle.jpg',
    },
    basePrice: 300,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-b5kf-white',
    type: 'mug',
    nameKey: 'mugB5kfWhite',
    image: '/mugs/mug-b5kf-white.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-b5kf-white.jpg',
        secondary: '/mugs/mug-b5kf-angle.jpg',
      },
    },
    basePrice: 250,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-purple-interior',
    type: 'mug',
    nameKey: 'mugPurpleInterior',
    image: '/mugs/mug-purple-interior.png',
    colorsImages: {
      '#ffffff': '/mugs/mug-purple-interior.png',
    },
    basePrice: 280,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-red-patch',
    type: 'mug',
    nameKey: 'mugRedPatch',
    image: '/mugs/mug-red-patch.jpg',
    colorsImages: {
      '#dc2626': {
        primary: '/mugs/mug-red-patch.jpg',
        secondary: '/mugs/mug-red-patch-side.jpg',
      },
    },
    basePrice: 300,
    colors: ['#dc2626'],
  },
  {
    id: 'mug-frosted',
    type: 'mug',
    nameKey: 'mugFrosted',
    image: '/mugs/mug-frosted.jpg',
    colorsImages: {
      '#f5f5f4': '/mugs/mug-frosted.jpg',
    },
    basePrice: 280,
    colors: ['#f5f5f4'],
  },
  {
    id: 'cup-glass-beer',
    type: 'cup',
    nameKey: 'cupGlassBeer',
    image: '/cups/cup-glass-beer.jpg',
    colorsImages: {
      '#e8f4fc': '/cups/cup-glass-beer.jpg',
    },
    basePrice: 250,
    colors: ['#e8f4fc'],
  },
  {
    id: 'mug-inside-daddy',
    type: 'mug',
    nameKey: 'mugInsideDaddy',
    image: '/mugs/mug-inside-daddy.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-daddy.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 350,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-love',
    type: 'mug',
    nameKey: 'mugInsideLove',
    image: '/mugs/mug-inside-love.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-love.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 350,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-birthday',
    type: 'mug',
    nameKey: 'mugInsideBirthday',
    image: '/mugs/mug-inside-birthday.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-birthday.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 350,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-mothers-day',
    type: 'mug',
    nameKey: 'mugInsideMothersDay',
    image: '/mugs/mug-inside-mothers-day.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-mothers-day.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 350,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-thanksgiving',
    type: 'mug',
    nameKey: 'mugInsideThanksgiving',
    image: '/mugs/mug-inside-thanksgiving.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-thanksgiving.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 380,
    colors: ['#ffffff'],
  },
  {
    id: 'bag-tote',
    type: 'bag',
    image: '/bags/bag-beige.jpg',
    colorsImages: {
      '#D8C3A5': {
        front: '/bags/bag-beige.jpg',
        back: '/bags/bag-beige-back.jpg',
      },
    },
    basePrice: 300,
    colors: ['#D8C3A5'],
    sides: ['front', 'back'],
  },
  {
    id: 'hoodie-basic',
    type: 'hoodie',
    image: '/hoodies/hoodie-charcoal.jpg',
    colorsImages: {
      '#1f2937': {
        front: '/hoodies/hoodie-charcoal.jpg',
        back: '/hoodies/hoodie-charcoal-back.jpg',
      },
      '#ffffff': {
        front: '/hoodies/hoodie-white.jpg',
        back: '/hoodies/hoodie-white-back.jpg',
      },
      '#1e40af': {
        front: '/hoodies/hoodie-blue.jpg',
        back: '/hoodies/hoodie-blue-back.jpg',
      },
    },
    basePrice: 1200,
    colors: ['#1f2937', '#ffffff', '#1e40af'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sides: ['front', 'back'],
  },
  {
    id: 'cap-classic',
    type: 'cap',
    image: '/caps/cap-charcoal-front.jpg',
    colorsImages: {
      '#1f2937': {
        front: '/caps/cap-charcoal-front.jpg',
        back: '/caps/cap-charcoal-back.jpg',
        left: '/caps/cap-charcoal-left.jpg',
        right: '/caps/cap-charcoal-right.jpg',
      },
      '#ffffff': {
        front: '/caps/cap-white-front.jpg',
        back: '/caps/cap-white-back.jpg',
        left: '/caps/cap-white-left.jpg',
        right: '/caps/cap-white-right.jpg',
      },
      '#dc2626': {
        front: '/caps/cap-red-front.jpg',
        back: '/caps/cap-red-back.jpg',
        left: '/caps/cap-red-left.jpg',
        right: '/caps/cap-red-right.jpg',
      },
    },
    basePrice: 500,
    colors: ['#1f2937', '#ffffff', '#dc2626'],
    sides: ['front', 'back', 'left', 'right'],
  },
  {
    id: 'thermos-classic',
    type: 'thermos',
    image: '/thermoses/thermos-blue.jpg',
    colorsImages: {
      '#374151': '/thermoses/thermos-charcoal.jpg',
      '#ffffff': '/thermoses/thermos-white.jpg',
      '#2f7cb2': '/thermoses/thermos-blue.jpg',
    },
    basePrice: 800,
    colors: ['#374151', '#ffffff', '#2f7cb2'],
  },
  {
    id: 'magnet-ceramic-5x7',
    type: 'magnet',
    nameKey: 'magnetCeramic5x7',
    image: '/magnets/magnet-ceramic-5x7.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/magnets/magnet-ceramic-5x7.jpg',
        secondary: '/magnets/magnet-ceramic-5x7-plain.jpg',
      },
    },
    basePrice: 98,
    colors: ['#ffffff'],
    uploadAspect: 5 / 7,
  },
  {
    id: 'magnet-ceramic-heart',
    type: 'magnet',
    nameKey: 'magnetCeramicHeart',
    image: '/magnets/magnet-ceramic-heart.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/magnets/magnet-ceramic-heart.jpg',
        secondary: '/magnets/magnet-ceramic-heart-plain.jpg',
      },
    },
    basePrice: 115,
    colors: ['#ffffff'],
    uploadAspect: 6 / 6.8,
  },
  {
    id: 'magnet-glass-5x7',
    type: 'magnet',
    nameKey: 'magnetGlass5x7',
    image: '/magnets/magnet-glass-5x7.jpg',
    colorsImages: {
      '#e8f4fc': {
        primary: '/magnets/magnet-glass-5x7.jpg',
        secondary: '/magnets/magnet-glass-5x7-plain.jpg',
      },
    },
    basePrice: 85,
    colors: ['#e8f4fc'],
    uploadAspect: 5 / 7,
  },
  {
    id: 'magnet-hardboard-square',
    type: 'magnet',
    nameKey: 'magnetHardboardSquare',
    image: '/magnets/magnet-hardboard-square.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-square.jpg',
    },
    basePrice: 62,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
  {
    id: 'magnet-hardboard-6x6',
    type: 'magnet',
    nameKey: 'magnetHardboard6x6',
    image: '/magnets/magnet-hardboard-6x6.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-6x6.jpg',
    },
    basePrice: 49,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
  {
    id: 'magnet-hardboard-oval',
    type: 'magnet',
    nameKey: 'magnetHardboardOval',
    image: '/magnets/magnet-hardboard-oval.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-oval.jpg',
    },
    basePrice: 49,
    colors: ['#f5f5f4'],
    uploadAspect: 9 / 6.5,
  },
  {
    id: 'magnet-hardboard-round',
    type: 'magnet',
    nameKey: 'magnetHardboardRound',
    image: '/magnets/magnet-hardboard-round.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-round.jpg',
    },
    basePrice: 62,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
];

export const productTypes: ProductType[] = [
  't-shirt',
  'hoodie',
  'bodysuit',
  'cap',
  'mug',
  'cup',
  'bag',
  'thermos',
  'magnet',
  'gift-set',
];

export const designCategories: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
