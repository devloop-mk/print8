'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { getServiceIcon } from '@/lib/data/service-icons';
import type { Service } from '@/lib/data/catalog';
import type { ResolvedService } from '@/lib/cms/public-content';
import { getServicePageHref } from '@/lib/services/service-links';

export function ServiceCard({
  service,
  variant = 'home',
}: {
  service: Service | ResolvedService;
  variant?: 'home' | 'homeCompact' | 'list';
}) {
  const t = useTranslations('services');
  const ts = useTranslations('services.items');
  const Icon = getServiceIcon(service.icon);
  const href = getServicePageHref(service.id);
  const isCompact = variant === 'home' || variant === 'homeCompact';
  const title =
    'title' in service && service.title
      ? service.title
      : ts(`${service.id}.title`);
  const description =
    'description' in service && service.description
      ? service.description
      : ts(`${service.id}.description`);
  const ctaLabel = t('seeOptions');

  if (isCompact) {
    return (
      <Link href={href} className="group block h-full">
        <Card className="h-full p-3 transition group-hover:border-brand-200 group-hover:shadow-md sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-brand-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-ink-900">
                {title}
              </h3>
              <p className="truncate text-xs text-ink-500">{description}</p>
            </div>
            <span className="shrink-0 text-sm text-brand-600" aria-hidden="true">
              →
            </span>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-brand-700 sm:mb-4 sm:h-12 sm:w-12">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-900 sm:text-lg">
        {title}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-ink-500 sm:mt-2 sm:line-clamp-none sm:text-base">
        {description}
      </p>
      <div className="mt-auto pt-4">
        <Link
          href={href}
          className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {ctaLabel} →
        </Link>
      </div>
    </Card>
  );
}
