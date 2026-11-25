export type PromoBannerSlide = {
  id: string;
  href: string;
  imageDesktop: string;
  imageMobile: string;
  /** Mobile hero crop anchor; defaults to center 40% in the carousel. */
  mobileObjectPosition?: string;
  /** Mobile object-fit; catalog still-life uses contain so products are not cropped. */
  mobileFit?: 'cover' | 'contain';
  /** Thin top strip with catalog kicker copy. */
  kicker?: boolean;
  /** Extra mobile image classes (e.g. lift a still-life above the copy overlay). */
  mobileImageClass?: string;
};

export const promoBannerSlides: PromoBannerSlide[] = [
  {
    id: 'promoCatalog',
    href: '/catalog',
    imageDesktop: '/banners/banner-desktop-catalog-v3.png',
    imageMobile: '/banners/banner-mobile-catalog-v4.png',
    mobileObjectPosition: 'center 82%',
    mobileImageClass: 'scale-[1.12] -translate-y-[7%] origin-center',
    kicker: true,
  },
  {
    id: 'apparel',
    href: '/products/category/apparel',
    imageDesktop: '/banners/banner-desktop-apparel.png',
    imageMobile: '/banners/banner-mobile-apparel.png',
  },
  {
    id: 'students',
    href: '/students/print',
    imageDesktop: '/banners/banner-desktop-students.png',
    imageMobile: '/banners/banner-mobile-students.png',
    mobileObjectPosition: 'center 42%',
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
    mobileObjectPosition: 'center top',
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
    href: '/products/custom',
    imageDesktop: '/banners/banner-desktop-coupons.png',
    imageMobile: '/banners/banner-mobile-coupons.png',
  },
];
