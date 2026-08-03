import type { ServiceId } from '@/lib/data/catalog';
import { getServicePageHref } from '@/lib/services/service-links';

export type ServicesHeroSlideConfig = {
  serviceId: ServiceId;
  image: string;
  accent: string;
  imageFit?: 'cover' | 'contain';
};

/** Shop-floor services highlighted in the services page hero carousel. */
export const servicesHeroSlides: ServicesHeroSlideConfig[] = [
  {
    serviceId: 'color-bw-printing',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-brand-900/90',
  },
  {
    serviceId: 'a3-posters',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-amber-900/90',
  },
  {
    serviceId: 'business-cards',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-rose-900/90',
  },
  {
    serviceId: 'laminating',
    image: '/hero/hero-your-brand-v2.png',
    accent: 'from-sky-900/90',
    imageFit: 'contain',
  },
  {
    serviceId: 'plastification',
    image: '/hero/hero-your-brand-v2.png',
    accent: 'from-indigo-900/90',
    imageFit: 'contain',
  },
  {
    serviceId: 'bookbinding',
    image: '/hero/hero-your-brand-v2.png',
    accent: 'from-emerald-900/90',
    imageFit: 'contain',
  },
  {
    serviceId: 'thesis-hardcover',
    image: '/hero/hero-your-brand-v2.png',
    accent: 'from-violet-900/90',
    imageFit: 'contain',
  },
  {
    serviceId: 'wedding-invitations',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-pink-900/90',
  },
];

export function getServicesHeroSlideHref(serviceId: ServiceId): string {
  return getServicePageHref(serviceId);
}
