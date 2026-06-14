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
    image: '/designs/bc-classic.svg',
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

export interface Product {
  id: string;
  type: ProductType;
  image: string;
  basePrice: number;
  colors?: string[];
  colorsImages?: Record<string, string>;
  sizes?: string[];
}

export const products: Product[] = [
  {
    id: 'tshirt-basic-white',
    type: 't-shirt',
    image: '/t-shirts/tshirt-white.png',
    colorsImages: {
      '#ffffff': '/t-shirts/tshirt-white.png',
      '#000000': '/t-shirts/tshirt-black.png',
      '#1e40af': '/t-shirts/tshirt-blue.png',
      '#dc2626': '/t-shirts/tshirt-red.png',
    },
    basePrice: 600,
    colors: ['#ffffff', '#000000', '#1e40af', '#dc2626'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
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
      '#D8C3A5': '/bags/bag-beige.png',
    },
    basePrice: 300,
    colors: [
      '#D8C3A5',
      //  '#1c1917', '#166534'
    ],
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
