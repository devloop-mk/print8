export type PromoBannerSlide = {
  id: string;
  href: string;
  imageDesktop: string;
  imageMobile: string;
};

export const promoBannerSlides: PromoBannerSlide[] = [
  {
    id: 'apparel',
    href: '/products/category/apparel',
    imageDesktop: '/banners/banner-desktop-apparel.png',
    imageMobile: '/banners/banner-mobile-apparel.png',
  },
  {
    id: 'branding',
    href: '/products/branding-pack',
    imageDesktop: '/banners/banner-desktop-branding.png',
    imageMobile: '/banners/banner-mobile-branding.png',
  },
  {
    id: 'ready',
    href: '/products/ready-designs',
    imageDesktop: '/banners/banner-desktop-ready.png',
    imageMobile: '/banners/banner-mobile-ready.png',
  },
  {
    id: 'couples',
    href: '/products/ready-designs/couples',
    imageDesktop: '/banners/banner-desktop-couples.png',
    imageMobile: '/banners/banner-mobile-couples.png',
  },
  {
    id: 'kids',
    href: '/products/ready-designs/kids',
    imageDesktop: '/banners/banner-desktop-kids.png',
    imageMobile: '/banners/banner-mobile-kids.png',
  },
  {
    id: 'local',
    href: '/products/ready-designs?collection=local-mk',
    imageDesktop: '/banners/banner-desktop-local.png',
    imageMobile: '/banners/banner-mobile-local.png',
  },
  {
    id: 'coupons',
    href: '/products',
    imageDesktop: '/banners/banner-desktop-coupons.png',
    imageMobile: '/banners/banner-mobile-coupons.png',
  },
  {
    id: 'cod',
    href: '/how-to-order',
    imageDesktop: '/banners/banner-desktop-cod.png',
    imageMobile: '/banners/banner-mobile-cod.png',
  },
];
