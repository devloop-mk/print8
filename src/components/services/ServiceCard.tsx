'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { getServiceIcon } from '@/lib/data/service-icons';
import { ServiceOrderButton } from '@/components/services/ServiceOrderButton';
import {
  serviceHasDetailOptions,
  type Service,
} from '@/lib/data/catalog';
import type { ResolvedService } from '@/lib/cms/public-content';
import { getServiceDestination } from '@/lib/data/service-routes';

export function ServiceCard({
  service,
  variant = 'home',
}: {
  service: Service | ResolvedService;
  variant?: 'home' | 'homeCompact' | 'list';
}) {
  const t = useTranslations('services');
  const ts = useTranslations('services.items');
  const locale = useLocale();
  const Icon = getServiceIcon(service.icon);
  const hasOptions = serviceHasDetailOptions(service);
  const optionsHref = getServiceDestination(service);
  const isCompact = variant === 'home' || variant === 'homeCompact';
  const showContactOnly = service.contactOnly;
  const title =
    'title' in service && service.title
      ? service.title
      : ts(`${service.id}.title`);
  const description =
    'description' in service && service.description
      ? service.description
      : ts(`${service.id}.description`);
  const priceLabel =
    service.startingPrice > 0
      ? `${t('startingFrom')} ${formatPrice(service.startingPrice, locale)}`
      : t('priceOnRequest');

  if (isCompact) {
    const compactBody = (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-brand-300 bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink-900">
            {title}
          </h3>
          <p className="text-xs font-medium text-brand-600">
            {priceLabel}
          </p>
        </div>
        {hasOptions && (
          <span className="shrink-0 text-sm text-brand-600" aria-hidden="true">
            →
          </span>
        )}
      </div>
    );

    if (hasOptions && optionsHref) {
      return (
        <Link href={optionsHref} className="group block h-full">
          <Card className="h-full p-3 transition group-hover:border-brand-200 group-hover:shadow-md sm:p-4">
            {compactBody}
          </Card>
        </Link>
      );
    }

    if (!showContactOnly && variant !== 'home') {
      return (
        <Card className="flex h-full flex-col p-3 sm:p-4">
          {compactBody}
          <div className="mt-3">
            <ServiceOrderButton
              serviceId={service.id}
              name={title}
              price={service.startingPrice}
              className="w-full"
            />
          </div>
        </Card>
      );
    }

    return (
      <Card className="h-full p-3 sm:p-4">{compactBody}</Card>
    );
  }

  const body = (
    <>
      <div className="mb-3 flex h-10 w-10 items-center justify-center border border-brand-300 bg-brand-50 text-brand-700 sm:mb-4 sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-900 sm:text-lg">
        {title}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-ink-500 sm:mt-2 sm:line-clamp-2 sm:text-base">
        {description}
      </p>
      <p className="mt-3 text-sm font-medium text-brand-600 sm:mt-4">
        {priceLabel}
      </p>
    </>
  );

  return (
    <Card className="flex h-full flex-col">
      {body}
      <div className="mt-auto pt-4">
        {showContactOnly ? (
          <Link
            href="/contact"
            className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('contactUs')} →
          </Link>
        ) : hasOptions && optionsHref ? (
          <Link
            href={optionsHref}
            className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t('seeOptions')} →
          </Link>
        ) : (
          <ServiceOrderButton
            serviceId={service.id}
            name={title}
            price={service.startingPrice}
          />
        )}
      </div>
    </Card>
  );
}
