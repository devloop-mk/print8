import type { Service, ServiceId } from '@/lib/data/catalog';
import { getServiceDestination } from '@/lib/data/service-routes';

export function getServicePageHref(serviceId: ServiceId | string): string {
  return `/services/${serviceId}`;
}

/** Primary action from a service detail page (not the listing card). */
export function getServiceActionHref(service: Service): string {
  if (service.contactOnly) return '/contact';

  const destination = getServiceDestination(service);
  if (destination) return destination;

  if (
    service.id === 'color-bw-printing' ||
    service.id === 'bookbinding' ||
    service.id === 'thesis-hardcover'
  ) {
    return '/students/print';
  }

  return '/contact';
}

export function getServiceActionKind(
  service: Service,
): 'options' | 'contact' | 'order-flow' {
  if (service.contactOnly) return 'contact';
  if (getServiceDestination(service)) return 'options';
  if (
    service.id === 'color-bw-printing' ||
    service.id === 'bookbinding' ||
    service.id === 'thesis-hardcover'
  ) {
    return 'order-flow';
  }
  return 'contact';
}
