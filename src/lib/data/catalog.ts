export type ServiceId =
  | 'business-cards'
  | 'restaurant-menus'
  | 'laminating'
  | 'color-bw-printing'
  | 'plastification'
  | 't-shirt-printing'
  | 'cup-printing'
  | 'bag-printing'
  | 'bookbinding'
  | 'wedding-invitations'
  | 'birthday-invitations'
  | 'gift-sets';

export interface Service {
  id: ServiceId;
  icon: string;
  startingPrice: number;
}

export const services: Service[] = [
  { id: 'business-cards', icon: 'CreditCard', startingPrice: 500 },
  { id: 'restaurant-menus', icon: 'BookOpen', startingPrice: 800 },
  { id: 'laminating', icon: 'Layers', startingPrice: 50 },
  { id: 'color-bw-printing', icon: 'Printer', startingPrice: 10 },
  { id: 'plastification', icon: 'Shield', startingPrice: 100 },
  { id: 't-shirt-printing', icon: 'Shirt', startingPrice: 600 },
  { id: 'cup-printing', icon: 'Coffee', startingPrice: 250 },
  { id: 'bag-printing', icon: 'ShoppingBag', startingPrice: 300 },
  { id: 'bookbinding', icon: 'BookMarked', startingPrice: 400 },
  { id: 'wedding-invitations', icon: 'Heart', startingPrice: 1500 },
  { id: 'birthday-invitations', icon: 'PartyPopper', startingPrice: 800 },
  { id: 'gift-sets', icon: 'Gift', startingPrice: 1200 },
];

export type DesignCategory =
  | 'business-cards'
  | 'wedding'
  | 'birthday'
  | 'menus'
  | 'general';

export interface DesignTemplate {
  id: string;
  category: DesignCategory;
  image: string;
  tags: string[];
}

export const designTemplates: DesignTemplate[] = [
  {
    id: 'bc-modern',
    category: 'business-cards',
    image: '/business-cards/business-card-1.jpg',
    tags: ['modern', 'minimal'],
  },
  {
    id: 'bc-classic',
    category: 'business-cards',
    image: '/business-cards/business-card-2.jpg',
    tags: ['classic', 'elegant'],
  },
  {
    id: 'wedding-floral',
    category: 'wedding',
    image: '/designs/wedding-floral.svg',
    tags: ['floral', 'romantic'],
  },
  {
    id: 'wedding-minimal',
    category: 'wedding',
    image: '/designs/wedding-minimal.svg',
    tags: ['minimal', 'modern'],
  },
  {
    id: 'birthday-fun',
    category: 'birthday',
    image: '/designs/birthday-fun.svg',
    tags: ['colorful', 'kids'],
  },
  {
    id: 'menu-elegant',
    category: 'menus',
    image: '/designs/menu-elegant.svg',
    tags: ['restaurant', 'elegant'],
  },
];

export type ProductType = 't-shirt' | 'mug' | 'cup' | 'bag' | 'gift-set';
export type ProductSide = 'front' | 'back';

export interface ProductSideImages {
  front: string;
  back: string;
}

export type ProductColorImages = Record<string, string | ProductSideImages>;

export interface Product {
  id: string;
  type: ProductType;
  image: string;
  basePrice: number;
  colors?: string[];
  colorsImages?: ProductColorImages;
  sizes?: string[];
  /** Products that support separate front/back customization */
  sides?: ProductSide[];
}

export type ProductDesignKind = 'image' | 'text';
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
    nameKey: 'mugDesign1',
    image: '/product-designs/mug-design-1.jpg',
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

export function isTextDesignTemplate(d: ProductDesignTemplate) {
  return d.kind === 'text' && Boolean(d.textStyle);
}

export function productSupportsSides(product: Product): boolean {
  return (product.sides?.length ?? 0) > 1;
}

export function getProductSides(product: Product): ProductSide[] {
  if (product.sides?.length) return product.sides;
  if (product.type === 't-shirt' || product.type === 'bag') {
    return ['front', 'back'];
  }
  return ['front'];
}

export function getProductMockup(
  product: Product,
  color: string,
  side: ProductSide,
): string {
  const entry = product.colorsImages?.[color];
  if (!entry) return product.image;
  if (typeof entry === 'string') {
    if (side === 'front') return entry;
    return entry.replace(/(\.[a-z]+)$/i, '-back$1');
  }
  return side === 'front' ? entry.front : entry.back || entry.front;
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

export const products: Product[] = [
  {
    id: 'tshirt-basic-white',
    type: 't-shirt',
    image: '/t-shirts/tshirt-white.png',
    colorsImages: {
      '#ffffff': {
        front: '/t-shirts/tshirt-white.png',
        back: '/t-shirts/tshirt-white-back.png',
      },
      '#000000': {
        front: '/t-shirts/tshirt-black.png',
        back: '/t-shirts/tshirt-black-back.png',
      },
      '#1e40af': {
        front: '/t-shirts/tshirt-blue.png',
        back: '/t-shirts/tshirt-blue-back.png',
      },
      '#dc2626': {
        front: '/t-shirts/tshirt-red.png',
        back: '/t-shirts/tshirt-red-back.png',
      },
    },
    basePrice: 600,
    colors: ['#ffffff', '#000000', '#1e40af', '#dc2626'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sides: ['front', 'back'],
  },
  {
    id: 'mug-classic',
    type: 'mug',
    image: '/mugs/mug-milkyblue.png',
    colorsImages: {
      '#ffffff': '/mugs/mug-white.png',
      '#ADD8E6': '/mugs/mug-milkyblue.png',
      '#000000': '/mugs/mug-black.png',
    },
    basePrice: 250,
    colors: ['#ffffff', '#ADD8E6', '#000000'],
  },
  {
    id: 'bag-tote',
    type: 'bag',
    image: '/bags/bag-beige.png',
    colorsImages: {
      '#D8C3A5': {
        front: '/bags/bag-beige.png',
        back: '/bags/bag-beige-back.png',
      },
    },
    basePrice: 300,
    colors: ['#D8C3A5'],
    sides: ['front', 'back'],
  },
  // {
  //   id: 'cup-paper',
  //   type: 'cup',
  //   image: '/products/cup-paper.svg',
  //   basePrice: 150,
  //   colors: ['#ffffff', '#fef3c7'],
  // },

  // {
  //   id: 'gift-set-premium',
  //   type: 'gift-set',
  //   image: '/products/gift-set.svg',
  //   basePrice: 1200,
  // },
];

export const productTypes: ProductType[] = [
  't-shirt',
  'mug',
  'cup',
  'bag',
  'gift-set',
];

export const designCategories: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
