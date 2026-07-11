export type HeroCarouselSlide = {
  id: string;
  href: string;
  image: string;
  imageFit?: 'cover' | 'contain';
};

export const heroCarouselSlides: HeroCarouselSlide[] = [
  {
    id: 'customApparel',
    href: '/products/category/apparel',
    image: '/hero/hero-custom-apparel-v2.png',
  },
  {
    id: 'readyDesigns',
    href: '/designs',
    image: '/hero/hero-ready-designs-v4.png',
  },
  {
    id: 'photoDesigns',
    href: '/products/ready-designs',
    image: '/hero/hero-photo-designs-v4.png',
  },
  {
    id: 'yourBrand',
    href: '/products/branding-pack',
    image: '/hero/hero-your-brand-v4.png',
  },
  {
    id: 'drinkware',
    href: '/products/category/drinkware',
    image: '/hero/hero-drinkware-v4.png',
  },
];
