import { drinkwarePackTemplates } from '@/lib/data/drinkware-pack';
import { babyPackTemplates } from '@/lib/data/baby-pack';
import { trendingMkPackTemplates } from '@/lib/data/trending-mk-pack';
import { chemistryDramaPackTemplates } from '@/lib/data/chemistry-drama-pack';
import { trendingCollectionsPackTemplates } from '@/lib/data/trending-collections-pack';
import { originalCollectionsPackTemplates } from '@/lib/data/original-collections-pack';
import { mkSlangPackTemplates } from '@/lib/data/mk-slang-pack';
import { mkRetroPlatesPackTemplates } from '@/lib/data/mk-retro-plates-pack';
import { familyPackTemplates } from '@/lib/data/family-pack';
import { kidsBirthdayPackTemplates } from '@/lib/data/kids-birthday-pack';
import { kidsGeneratedPackTemplates } from '@/lib/data/kids-generated-pack';
import { dualSideGeneratedPackTemplates } from '@/lib/data/dual-side-generated-pack';
import { localMkDrinkwarePackTemplates } from '@/lib/data/local-mk-drinkware-pack';
import { mkFolkPackTemplates } from '@/lib/data/mk-folk-pack';
import { mkMugsPackTemplates } from '@/lib/data/mk-mugs-pack';
import { capPackTemplates } from '@/lib/data/cap-pack';
import { bagPackTemplates } from '@/lib/data/bag-pack';
import { poloPackTemplates } from '@/lib/data/polo-pack';
import { streetwearPackTemplates } from '@/lib/data/streetwear-pack';
import { getCouplePackDesignTemplates } from '@/lib/data/couple-pack';
import {
  buildUnisexTshirtColorImages,
  getUnisexTshirtMockupPath,
  TSHIRT_UNISEX_COLOR_HEXES,
} from '@/lib/products/tshirt-unisex-colors';
import {
  buildWomenTshirtColorImages,
  getWomenTshirtMockupPath,
  TSHIRT_WOMEN_COLOR_HEXES,
} from '@/lib/products/tshirt-women-colors';
import {
  buildKidsTshirtColorImages,
  getKidsTshirtMockupPath,
  TSHIRT_KIDS_COLOR_HEXES,
} from '@/lib/products/tshirt-kids-colors';
import { getProductColorImagesEntry } from '@/lib/products/product-color-images';
import type { TshirtPricingOverride } from '@/lib/products/tshirt-print-pricing';
import { getPoloMockupPath } from '@/lib/products/polo-mockup-paths';
import { premadeDesignAppliesToProduct } from '@/lib/products/premade-design-product-match';
import { supplierCatalogProducts } from '@/lib/data/supplier-catalog-products';

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
  | 'a3-posters';

export const serviceCategoryOrder = [
  'print',
  'finishing',
  'merch',
  'gifts',
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
    startingPrice: 350,
    customization: 'products',
    productTypes: ['t-shirt'],
  },
  {
    id: 'hoodie-printing',
    icon: 'Shirt',
    category: 'merch',
    startingPrice: 1200,
    customization: 'products',
    productTypes: ['hoodie'],
  },
  {
    id: 'bodysuit-printing',
    icon: 'Baby',
    category: 'merch',
    startingPrice: 500,
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
    startingPrice: 250,
    customization: 'products',
    productTypes: ['bag'],
  },
  {
    id: 'cup-printing',
    icon: 'Coffee',
    category: 'merch',
    startingPrice: 350,
    customization: 'products',
    productTypes: ['mug', 'cup'],
  },
  {
    id: 'thermos-printing',
    icon: 'GlassWater',
    category: 'merch',
    startingPrice: 800,
    customization: 'products',
    productTypes: ['thermos'],
  },
  {
    id: 'magnet-printing',
    icon: 'Magnet',
    category: 'gifts',
    startingPrice: 150,
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
    startingPrice: 550,
    customization: 'products',
    productTypes: ['plaque'],
  },
  {
    id: 'photo-stone',
    icon: 'Gem',
    category: 'gifts',
    startingPrice: 680,
    customization: 'products',
    productTypes: ['photo-stone'],
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
    // Cheapest configurable menu job: A5 spiral, 8 pages, coated, 10 pcs (650)
    // plus the 800 MKD cover design fee. See lib/designs/menu-print-options.
    startingPrice: 1450,
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
    id: 'a3-posters',
    icon: 'Image',
    category: 'print',
    startingPrice: 150,
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
    featured: true,
    customization: 'none',
  },
  {
    id: 'plastification',
    icon: 'Shield',
    category: 'finishing',
    startingPrice: 100,
    featured: true,
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
  /** Lightweight raster preview for gallery listings (avoids heavy live SVG). */
  galleryImage?: string;
  tags: string[];
  kind: DesignTemplateKind;
  layoutId?: string;
  /** Raw SVG template from `public/NEW_DESIGNS` with editable text & colors */
  svgTemplateId?: string;
  /** Catalog / order preview aspect ratio (width / height) */
  thumbAspect?: number;
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
    id: 'svg-wedding-watercolor-daisy',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-watercolor-daisy.svg',
    tags: ['watercolor', 'daisy', 'blue', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-watercolor-daisy',
  },
  {
    id: 'svg-wedding-lemon-tiles',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-lemon-tiles.svg',
    tags: ['mediterranean', 'lemon', 'tiles', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-lemon-tiles',
  },
  {
    id: 'svg-wedding-arch-hands',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-arch-hands.svg',
    tags: ['arch', 'botanical', 'romantic', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-arch-hands',
  },
{
    id: 'svg-wedding-cdr-floral-garden',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-floral-garden.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-floral-garden.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical', 'garden'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-floral-garden',
  },
  {
    id: 'svg-wedding-cdr-spring-bloom',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-spring-bloom.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-spring-bloom.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical', 'garden', 'romantic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-spring-bloom',
  },
  {
    id: 'svg-wedding-cdr-golden-band',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-golden-band.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-golden-band.webp',
    tags: ['cdr', 'editable', 'premium', 'classic', 'gold'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-golden-band',
  },
  {
    id: 'svg-wedding-cdr-elegant-vine',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-elegant-vine.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-elegant-vine.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical', 'classic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-elegant-vine',
  },
  {
    id: 'svg-wedding-cdr-classic-frame',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-classic-frame.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-classic-frame.webp',
    tags: ['cdr', 'editable', 'premium', 'classic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-classic-frame',
  },
  {
    id: 'svg-wedding-cdr-rustic-wreath',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-rustic-wreath.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-rustic-wreath.webp',
    tags: ['cdr', 'editable', 'premium', 'rustic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-rustic-wreath',
  },
  {
    id: 'svg-wedding-cdr-romantic-rose',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-romantic-rose.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-romantic-rose.webp',
    tags: ['cdr', 'editable', 'premium', 'romantic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-romantic-rose',
  },
  {
    id: 'svg-wedding-cdr-vintage-lace',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-vintage-lace.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-vintage-lace.webp',
    tags: ['cdr', 'editable', 'premium', 'classic', 'romantic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-vintage-lace',
  },
  {
    id: 'svg-wedding-cdr-botanical-frame',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-botanical-frame.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-botanical-frame.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-botanical-frame',
  },
  {
    id: 'svg-wedding-cdr-navy-gold',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-navy-gold.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-navy-gold.webp',
    tags: ['cdr', 'editable', 'premium', 'classic', 'navy'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-navy-gold',
  },
  {
    id: 'svg-wedding-cdr-olive-grove',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-olive-grove.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-olive-grove.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical', 'garden'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-olive-grove',
  },
  {
    id: 'svg-wedding-cdr-teal-floral',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-teal-floral.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-teal-floral.webp',
    tags: ['cdr', 'editable', 'premium', 'botanical', 'garden'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-teal-floral',
  },
  {
    id: 'svg-wedding-cdr-magenta-classic',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/wedding-cdr-magenta-classic.svg',
    galleryImage: '/NEW_DESIGNS/wedding/gallery-thumbs/wedding-cdr-magenta-classic.webp',
    tags: ['cdr', 'editable', 'premium', 'classic', 'romantic'],
    kind: 'customizable',
    svgTemplateId: 'svg-wedding-cdr-magenta-classic',
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
  {
    id: 'svg-menu-sushi',
    category: 'menus',
    image: '/NEW_DESIGNS/menus/menu-print-sushi-front.svg',
    tags: ['sushi', 'japanese', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-menu-sushi',
  },
  {
    id: 'svg-menu-seafood',
    category: 'menus',
    image: '/NEW_DESIGNS/menus/menu-print-seafood-front.svg',
    tags: ['seafood', 'ocean', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-menu-seafood',
  },
  {
    id: 'svg-menu-cafe',
    category: 'menus',
    image: '/NEW_DESIGNS/menus/menu-print-cafe-front.svg',
    tags: ['cafe', 'coffee', 'editable'],
    kind: 'customizable',
    svgTemplateId: 'svg-menu-cafe',
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
  | 'photo-stone'
  | 'puzzle'
  | 'plaque'
  | 'gift-box'
  | 'gift-set'
  | 'microfiber-cloth';

/** T-shirt garment cut (unisex, women's fitted, kids). */
export type GarmentFit = 'unisex' | 'women' | 'kids';
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
  const entry = getProductColorImagesEntry(product.colorsImages, color);
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
  /** Garment fit — women's-only SKUs (e.g. fitted white/black tee) use `women`. */
  fit?: GarmentFit;
  /** When true, product is only reachable via garment-fit selection on designs. */
  fitOnly?: boolean;
  /** Default crop aspect for upload-only products (e.g. magnets) */
  uploadAspect?: number;
  /** Koni / supplier SKU — internal only (orders, admin), not on storefront cards */
  vendorSku?: string;
  /** Optional i18n key under `products.detail.productDescriptions` — replaces the default blurb. */
  detailDescriptionKey?: string;
  /** Optional i18n key under `products.detail.productNotes` — shown below the main blurb. */
  detailNoteKey?: string;
  /** Optional t-shirt / polo print tier overrides (MKD). */
  tshirtPricing?: TshirtPricingOverride;
}

export function isMagnetProduct(product: Product): boolean {
  return product.type === 'magnet';
}

export function getMagnetDisplayMockup(
  product: Product,
  color: string,
): string {
  const entry = getProductColorImagesEntry(product.colorsImages, color);
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

/** Per-side overlay artwork and placement (used for back in dual-sided designs). */
export interface ProductDesignSideOverlay {
  overlayImage?: string;
  overlaySvg?: string;
  overlayRecolor?: {
    primary: string;
    secondary?: string;
    slots?: 1 | 2;
  };
  overlayColorVariants?: Record<string, string>;
  overlayScale?: number;
  overlayPosition?: { x: number; y: number };
  overlayByProductType?: Partial<
    Record<ProductType, { position?: { x: number; y: number }; scale?: number }>
  >;
}

export interface ProductDesignTemplate {
  id: string;
  kind: ProductDesignKind;
  category: ProductDesignCategory;
  productTypes: ProductType[];
  productIds?: string[];
  nameKey: string;
  defaultSide: ProductSide;
  /** Which sides have pre-made art. Defaults to [defaultSide]. */
  designSides?: ProductSide[];
  /** Back-side overlay when designSides includes both front and back. */
  backOverlay?: ProductDesignSideOverlay;
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
  /** Per product-type placement when default overlay position is tuned for another type */
  overlayByProductType?: Partial<
    Record<ProductType, { position?: { x: number; y: number }; scale?: number }>
  >;
  /** Recommended shirt color hex for this ink (e.g. cream on black) */
  recommendedColor?: string;
  /** Shirt colors this design supports — omit to infer from variants / contrast */
  applicableColors?: string[];
  /** Per t-shirt fit palette — overrides applicableColors for that fit when set */
  applicableColorsByFit?: Partial<Record<GarmentFit, string[]>>;
  /** Per product-type palette (hoodie, bodysuit, …) — overrides applicableColors when set */
  applicableColorsByProductType?: Partial<Record<ProductType, string[]>>;
  /** T-shirt garment fits this design supports — omit defaults to unisex only */
  applicableFits?: GarmentFit[];
  /** Styled Macedonian text layout — used for `text` kind */
  textStyle?: ProductDesignTextStyle;
  /** Display title (bulk-imported designs) */
  titleEn?: string;
  titleMk?: string;
  /** Private full-resolution print asset path or R2 key */
  printMasterImage?: string;
  /** Browse grouping, e.g. basketball, anime */
  collection?: string;
}

export const productDesignTemplates: ProductDesignTemplate[] = [
  {
    id: 'tee-print-gym-alfa-mentalitet',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'gymAlfaMentalitet',
    overlayImage: '/NEW_DESIGNS/t-shirts/gym-alfa-mentalitet.png',
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayScale: 40,
    overlayPosition: { x: 50, y: 54 },
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
    overlayPosition: { x: 50, y: 54 },
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
    overlayPosition: { x: 50, y: 53 },
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
    overlayPosition: { x: 50, y: 55 },
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
    overlayPosition: { x: 50, y: 55 },
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
    overlayPosition: { x: 50, y: 54 },
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
      photoPosition: { x: 50, y: 54 },
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
      photoPosition: { x: 50, y: 54 },
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
  ...streetwearPackTemplates,
  ...drinkwarePackTemplates,
  ...localMkDrinkwarePackTemplates,
  ...mkFolkPackTemplates,
  ...mkMugsPackTemplates,
  ...capPackTemplates,
  ...bagPackTemplates,
  ...poloPackTemplates,
  ...babyPackTemplates,
  ...trendingMkPackTemplates,
  ...chemistryDramaPackTemplates,
  ...trendingCollectionsPackTemplates,
  ...originalCollectionsPackTemplates,
  ...mkSlangPackTemplates,
  ...mkRetroPlatesPackTemplates,
  ...familyPackTemplates,
  ...kidsBirthdayPackTemplates,
  ...kidsGeneratedPackTemplates,
  ...dualSideGeneratedPackTemplates,
  ...getCouplePackDesignTemplates(),
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
    Boolean(
      d.overlayImage ||
        d.overlaySvg ||
        d.overlayColorVariants ||
        d.backOverlay?.overlayImage ||
        d.backOverlay?.overlaySvg ||
        d.backOverlay?.overlayColorVariants,
    )
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
  const entry = getProductColorImagesEntry(product.colorsImages, color);
  if (!entry) return product.image;
  if (typeof entry === 'string') {
    return mockupPathForSide(entry, side);
  }
  if (isProductColorPair(entry)) {
    return entry.primary;
  }

  if (isProductSideImages(entry)) {
    return entry[side] ?? entry.front;
  }

  return product.image;
}

export function getProductGallerySlides(
  product: Product,
  color: string,
): ProductGallerySlide[] {
  const entry = getProductColorImagesEntry(product.colorsImages, color);

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
  return productDesignTemplates.filter((d) =>
    premadeDesignAppliesToProduct(d, product),
  );
}

export function getProductDesignTemplate(id: string) {
  return (
    productDesignTemplates.find((d) => d.id === id) ??
    getCouplePackDesignTemplates().find((d) => d.id === id)
  );
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

export function isBrowsableProduct(product: Product): boolean {
  return !product.fitOnly;
}

export function getBrowsableProducts(): Product[] {
  return products.filter(isBrowsableProduct);
}

export function getProductsForService(service: Service) {
  if (service.customization !== 'products' || !service.productTypes?.length) {
    return [];
  }
  return products.filter(
    (p) => service.productTypes!.includes(p.type) && isBrowsableProduct(p),
  );
}

export const products: Product[] = [
  {
    id: 'tshirt-unisex',
    type: 't-shirt',
    fit: 'unisex',
    nameKey: 'tshirtUnisex',
    image: getUnisexTshirtMockupPath('bela', 'front'),
    colorsImages: buildUnisexTshirtColorImages(),
    /** Fallback when printPackage missing — matches front-small. Display uses blank (350). */
    basePrice: 500,
    colors: TSHIRT_UNISEX_COLOR_HEXES,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sides: ['front', 'back'],
  },
  {
    id: 'tshirt-women-fitted',
    type: 't-shirt',
    fit: 'women',
    fitOnly: true,
    nameKey: 'tshirtWomenFitted',
    image: getWomenTshirtMockupPath('bela', 'front'),
    colorsImages: buildWomenTshirtColorImages(),
    /** Fallback when printPackage missing — matches front-small. */
    basePrice: 500,
    colors: TSHIRT_WOMEN_COLOR_HEXES,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sides: ['front', 'back'],
  },
  {
    id: 'tshirt-kids',
    type: 't-shirt',
    fit: 'kids',
    fitOnly: true,
    nameKey: 'tshirtKids',
    image: getKidsTshirtMockupPath('bela', 'front'),
    colorsImages: buildKidsTshirtColorImages(),
    /** Fallback when printPackage missing — matches front-small. */
    basePrice: 500,
    colors: TSHIRT_KIDS_COLOR_HEXES,
    sizes: ['2-3', '4-5', '6-7', '8-9', '10-12', '12-14'],
    sides: ['front', 'back'],
  },
  {
    id: 'polo-frut-original-white',
    type: 't-shirt',
    fit: 'unisex',
    nameKey: 'poloFrutOriginalWhite',
    vendorSku: '0632140',
    image: getPoloMockupPath('front'),
    colorsImages: {
      '#ffffff': {
        front: getPoloMockupPath('front'),
        back: getPoloMockupPath('back'),
      },
    },
    tshirtPricing: {
      blank: 700,
      front: { small: 850, medium: 950, large: 1100 },
    },
    /** Fallback when printPackage missing — matches front-small. */
    basePrice: 850,
    colors: ['#ffffff'],
    sizes: ['S', 'M', 'L', 'XXL'],
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
      '#ffffff': '/mugs/mug-white-classic-v2.jpg',
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
    vendorSku: 'B101H',
    image: '/mugs/mug-heart-handle.jpg',
    colorsImages: {
      '#ffffff': '/mugs/mug-heart-handle.jpg',
    },
    basePrice: 350,
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
    vendorSku: 'B101B',
    image: '/mugs/mug-b5kf-white.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-b5kf-white.jpg',
        secondary: '/mugs/mug-b5kf-angle.jpg',
      },
    },
    basePrice: 350,
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
    vendorSku: 'CB11C-R',
    image: '/mugs/mug-red-patch.jpg',
    colorsImages: {
      '#dc2626': {
        primary: '/mugs/mug-red-patch.jpg',
        secondary: '/mugs/mug-red-patch-side.jpg',
      },
    },
    basePrice: 470,
    colors: ['#dc2626'],
  },
  {
    id: 'mug-frosted',
    type: 'mug',
    nameKey: 'mugFrosted',
    vendorSku: 'B1G-01',
    image: '/mugs/mug-frosted.jpg',
    colorsImages: {
      '#f5f5f4': '/mugs/mug-frosted.jpg',
    },
    basePrice: 450,
    colors: ['#f5f5f4'],
  },
  {
    id: 'cup-glass-beer',
    type: 'cup',
    nameKey: 'cupGlassBeer',
    vendorSku: 'BN1C',
    image: '/cups/cup-glass-beer.jpg',
    colorsImages: {
      '#e8f4fc': '/cups/cup-glass-beer.jpg',
    },
    basePrice: 600,
    colors: ['#e8f4fc'],
  },
  {
    id: 'mug-inside-daddy',
    type: 'mug',
    nameKey: 'mugInsideDaddy',
    vendorSku: 'BD101-FD',
    detailNoteKey: 'mugInside',
    image: '/mugs/mug-inside-daddy.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-daddy.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 450,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-love',
    type: 'mug',
    nameKey: 'mugInsideLove',
    vendorSku: 'BD101-H',
    detailNoteKey: 'mugInside',
    image: '/mugs/mug-inside-love.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-love.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 450,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-birthday',
    type: 'mug',
    nameKey: 'mugInsideBirthday',
    vendorSku: 'BD101-HB',
    detailNoteKey: 'mugInside',
    image: '/mugs/mug-inside-birthday.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-birthday.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 450,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-mothers-day',
    type: 'mug',
    nameKey: 'mugInsideMothersDay',
    vendorSku: 'BD101-MD',
    detailNoteKey: 'mugInside',
    image: '/mugs/mug-inside-mothers-day.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-mothers-day.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 450,
    colors: ['#ffffff'],
  },
  {
    id: 'mug-inside-thanksgiving',
    type: 'mug',
    nameKey: 'mugInsideThanksgiving',
    vendorSku: 'BD101-TKG',
    detailNoteKey: 'mugInside',
    image: '/mugs/mug-inside-thanksgiving.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/mugs/mug-inside-thanksgiving.jpg',
        secondary: '/mugs/mug-b5kf-white.jpg',
      },
    },
    basePrice: 450,
    colors: ['#ffffff'],
  },
  {
    id: 'bag-naturella-natural',
    type: 'bag',
    nameKey: 'bagNaturellaNatural',
    vendorSku: '3402871',
    image: '/bags/bag-naturella-natural.jpg',
    colorsImages: {
      '#E8DCC8': {
        front: '/bags/bag-naturella-natural.jpg',
        back: '/bags/bag-naturella-natural.jpg',
      },
    },
    basePrice: 300,
    colors: ['#E8DCC8'],
    sides: ['front', 'back'],
  },
  {
    id: 'gift-case-pure-pack-subli',
    type: 'gift-box',
    nameKey: 'giftCasePurePackSubli',
    vendorSku: '3732191',
    fitOnly: true,
    image: '/gift-boxes/case-pure-pack-subli.jpg',
    colorsImages: {
      '#f5f5f4': '/gift-boxes/case-pure-pack-subli.jpg',
    },
    basePrice: 50,
    colors: ['#f5f5f4'],
    uploadAspect: 95 / 55,
  },
  {
    id: 'cloth-pure-microfiber-white',
    type: 'microfiber-cloth',
    nameKey: 'clothPureMicrofiberWhite',
    vendorSku: '3732090+3732191',
    image: '/microfiber-cloths/cloth-pure-microfiber-white.jpg',
    colorsImages: {
      '#ffffff': '/microfiber-cloths/cloth-pure-microfiber-white.jpg',
    },
    basePrice: 100,
    colors: ['#ffffff'],
    uploadAspect: 18 / 15,
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
    vendorSku: 'TFM01',
    image: '/magnets/magnet-ceramic-5x7.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/magnets/magnet-ceramic-5x7.jpg',
        secondary: '/magnets/magnet-ceramic-5x7-plain.jpg',
      },
    },
    basePrice: 230,
    colors: ['#ffffff'],
    uploadAspect: 5 / 7,
  },
  {
    id: 'magnet-ceramic-heart',
    type: 'magnet',
    nameKey: 'magnetCeramicHeart',
    vendorSku: 'CFM02',
    image: '/magnets/magnet-ceramic-heart.jpg',
    colorsImages: {
      '#ffffff': {
        primary: '/magnets/magnet-ceramic-heart.jpg',
        secondary: '/magnets/magnet-ceramic-heart-plain.jpg',
      },
    },
    basePrice: 250,
    colors: ['#ffffff'],
    uploadAspect: 6 / 6.8,
  },
  {
    id: 'magnet-glass-5x7',
    type: 'magnet',
    nameKey: 'magnetGlass5x7',
    vendorSku: 'TFM03',
    image: '/magnets/magnet-glass-5x7.jpg',
    colorsImages: {
      '#e8f4fc': {
        primary: '/magnets/magnet-glass-5x7.jpg',
        secondary: '/magnets/magnet-glass-5x7-plain.jpg',
      },
    },
    basePrice: 200,
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
    basePrice: 120,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
  {
    id: 'magnet-hardboard-6x6',
    type: 'magnet',
    nameKey: 'magnetHardboard6x6',
    vendorSku: 'HBFM04',
    image: '/magnets/magnet-hardboard-6x6.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-6x6.jpg',
    },
    basePrice: 150,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
  {
    id: 'magnet-hardboard-oval',
    type: 'magnet',
    nameKey: 'magnetHardboardOval',
    vendorSku: 'HBFM05',
    image: '/magnets/magnet-hardboard-oval.jpg',
    colorsImages: {
      '#f5f5f4': '/magnets/magnet-hardboard-oval.jpg',
    },
    basePrice: 170,
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
    basePrice: 120,
    colors: ['#f5f5f4'],
    uploadAspect: 1,
  },
  ...supplierCatalogProducts,
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
  'photo-stone',
  'puzzle',
  'plaque',
  'gift-box',
  'gift-set',
  'microfiber-cloth',
];

export const designCategories: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
