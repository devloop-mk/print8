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

export type ProductColorImages = Record<
  string,
  string | ProductSideImages
>;

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

export interface ProductDesignTemplate {
  id: string;
  productTypes: ProductType[];
  nameKey: string;
  image: string;
  defaultSide: ProductSide;
  scale?: number;
  position?: { x: number; y: number };
}

export const productDesignTemplates: ProductDesignTemplate[] = [
  {
    id: 'tee-smile',
    productTypes: ['t-shirt'],
    nameKey: 'smile',
    image: '/product-designs/smile.svg',
    defaultSide: 'front',
    scale: 45,
    position: { x: 50, y: 38 },
  },
  {
    id: 'tee-heart',
    productTypes: ['t-shirt'],
    nameKey: 'heart',
    image: '/product-designs/heart.svg',
    defaultSide: 'front',
    scale: 40,
    position: { x: 50, y: 38 },
  },
  {
    id: 'tee-mountain',
    productTypes: ['t-shirt'],
    nameKey: 'mountain',
    image: '/product-designs/mountain.svg',
    defaultSide: 'front',
    scale: 55,
    position: { x: 50, y: 40 },
  },
  {
    id: 'tee-back-logo',
    productTypes: ['t-shirt'],
    nameKey: 'backLogo',
    image: '/product-designs/back-logo.svg',
    defaultSide: 'back',
    scale: 35,
    position: { x: 50, y: 35 },
  },
  {
    id: 'mug-floral',
    productTypes: ['mug'],
    nameKey: 'floral',
    image: '/product-designs/floral.svg',
    defaultSide: 'front',
    scale: 50,
    position: { x: 50, y: 45 },
  },
];

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
  return productDesignTemplates.filter((d) =>
    d.productTypes.includes(product.type),
  );
}

export function getProductDesignTemplate(id: string) {
  return productDesignTemplates.find((d) => d.id === id);
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
