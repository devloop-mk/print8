export type ServiceId =
  | 'business-cards'
  | 'restaurant-menus'
  | 'laminating'
  | 'color-bw-printing'
  | 'plastification'
  | 't-shirt-printing'
  | 'hoodie-printing'
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
  | 'upload-pickup'
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
    icon: 'FlaskConical',
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
    startingPrice: 150,
    customization: 'none',
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
    icon: 'Heart',
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
    id: 'upload-pickup',
    icon: 'Upload',
    category: 'special',
    startingPrice: 0,
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
}

export const designTemplates: DesignTemplate[] = [
  {
    id: 'bc-modern',
    category: 'business-cards',
    image: '/business-cards/business-card-1.jpg',
    tags: ['modern', 'minimal'],
    kind: 'fixed',
  },
  {
    id: 'bc-classic',
    category: 'business-cards',
    image: '/business-cards/business-card-2.jpg',
    tags: ['classic', 'elegant'],
    kind: 'fixed',
  },
  {
    id: 'bc-editable-minimal',
    category: 'business-cards',
    image: '/designs/bc-editable-minimal.svg',
    tags: ['modern', 'editable'],
    kind: 'customizable',
    layoutId: 'bc-minimal',
  },
  {
    id: 'bc-editable-classic',
    category: 'business-cards',
    image: '/designs/bc-editable-classic.svg',
    tags: ['classic', 'editable'],
    kind: 'customizable',
    layoutId: 'bc-classic',
  },
  {
    id: 'bc-executive',
    category: 'business-cards',
    image: '/designs/bc-executive.svg',
    tags: ['professional', 'premium'],
    kind: 'customizable',
    layoutId: 'bc-executive',
  },
  {
    id: 'wedding-floral',
    category: 'wedding',
    image: '/designs/wedding-floral.svg',
    tags: ['floral', 'romantic'],
    kind: 'customizable',
    layoutId: 'wedding-floral',
  },
  {
    id: 'wedding-minimal',
    category: 'wedding',
    image: '/designs/wedding-minimal.svg',
    tags: ['minimal', 'modern'],
    kind: 'customizable',
    layoutId: 'wedding-minimal',
  },
  {
    id: 'birthday-fun',
    category: 'birthday',
    image: '/designs/birthday-fun.svg',
    tags: ['colorful', 'kids'],
    kind: 'customizable',
    layoutId: 'birthday-fun',
  },
  {
    id: 'birthday-modern',
    category: 'birthday',
    image: '/designs/birthday-modern.svg',
    tags: ['modern', 'elegant'],
    kind: 'customizable',
    layoutId: 'birthday-modern',
  },
  {
    id: 'menu-elegant',
    category: 'menus',
    image: '/designs/menu-elegant.svg',
    tags: ['restaurant', 'elegant'],
    kind: 'customizable',
    layoutId: 'menu-elegant',
  },
  {
    id: 'menu-modern',
    category: 'menus',
    image: '/designs/menu-modern.svg',
    tags: ['restaurant', 'modern'],
    kind: 'customizable',
    layoutId: 'menu-modern',
  },
];

export type ProductType =
  | 't-shirt'
  | 'hoodie'
  | 'cap'
  | 'mug'
  | 'cup'
  | 'bag'
  | 'thermos'
  | 'gift-set';
export type ProductSide = 'front' | 'back' | 'left' | 'right';

export interface ProductSideImages {
  front: string;
  back: string;
  left?: string;
  right?: string;
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

  const bySide: Partial<Record<ProductSide, string | undefined>> = {
    front: entry.front,
    back: entry.back,
    left: entry.left,
    right: entry.right,
  };

  return bySide[side] ?? entry.front;
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
  return template.kind === 'customizable' && Boolean(template.layoutId);
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
    id: 'mug-classic',
    type: 'mug',
    image: '/mugs/mug-milkyblue.jpg',
    colorsImages: {
      '#ffffff': '/mugs/mug-white.jpg',
      '#ADD8E6': '/mugs/mug-milkyblue.jpg',
      '#000000': '/mugs/mug-black.jpg',
    },
    basePrice: 250,
    colors: ['#ffffff', '#ADD8E6', '#000000'],
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
];

export const productTypes: ProductType[] = [
  't-shirt',
  'hoodie',
  'cap',
  'mug',
  'cup',
  'bag',
  'thermos',
  'gift-set',
];

export const designCategories: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
