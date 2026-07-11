import type { ServiceId } from '@/lib/data/catalog';
import { services } from '@/lib/data/catalog';
import { getServiceDestination } from '@/lib/data/service-routes';

export type ServicesHeroSlideConfig = {
  serviceId: ServiceId;
  image: string;
  accent: string;
  imageFit?: 'cover' | 'contain';
};

/** Popular / featured services shown in the services page hero carousel. */
export const servicesHeroSlides: ServicesHeroSlideConfig[] = [
  {
    serviceId: 't-shirt-printing',
    image: '/hero/hero-custom-apparel-v2.png',
    accent: 'from-brand-900/90',
  },
  {
    serviceId: 'hoodie-printing',
    image: '/hero/hero-custom-apparel-v2.png',
    accent: 'from-indigo-900/90',
  },
  {
    serviceId: 'thermos-printing',
    image: '/hero/hero-drinkware-v2.png',
    accent: 'from-emerald-900/90',
  },
  {
    serviceId: 'magnet-printing',
    image: '/hero/hero-photo-designs-v3.png',
    accent: 'from-violet-900/90',
  },
  {
    serviceId: 'business-cards',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-rose-900/90',
  },
  {
    serviceId: 'wedding-invitations',
    image: '/hero/hero-ready-designs-v2.png',
    accent: 'from-pink-900/90',
  },
  {
    serviceId: 'thesis-hardcover',
    image: '/hero/hero-your-brand-v2.png',
    accent: 'from-sky-900/90',
    imageFit: 'contain',
  },
];

export function getServicesHeroSlideHref(serviceId: ServiceId): string {
  const service = services.find((entry) => entry.id === serviceId);
  if (!service) return `/services/${serviceId}`;
  return getServiceDestination(service) ?? `/services/${serviceId}`;
}
