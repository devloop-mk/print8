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
    image: '/services/hero/service-hero-color-bw-printing.png',
    accent: 'from-brand-900/90',
  },
  {
    serviceId: 'a3-posters',
    image: '/services/hero/service-hero-a3-posters.png',
    accent: 'from-amber-900/90',
  },
  {
    serviceId: 'business-cards',
    image: '/services/hero/service-hero-business-cards.png',
    accent: 'from-rose-900/90',
  },
  {
    serviceId: 'laminating',
    image: '/services/hero/service-hero-laminating.png',
    accent: 'from-sky-900/90',
  },
  {
    serviceId: 'plastification',
    image: '/services/hero/service-hero-plastification.png',
    accent: 'from-indigo-900/90',
  },
  {
    serviceId: 'bookbinding',
    image: '/services/hero/service-hero-bookbinding.png',
    accent: 'from-emerald-900/90',
  },
  {
    serviceId: 'thesis-hardcover',
    image: '/services/hero/service-hero-thesis-hardcover.png',
    accent: 'from-violet-900/90',
  },
  {
    serviceId: 'wedding-invitations',
    image: '/services/hero/service-hero-wedding-invitations.png',
    accent: 'from-pink-900/90',
  },
];

export function getServicesHeroSlideHref(serviceId: ServiceId): string {
  return getServicePageHref(serviceId);
}
