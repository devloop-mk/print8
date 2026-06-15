import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';
import { absoluteUrl, getSiteUrl, localePath, openGraphLocale } from '@/lib/seo/site';

type BuildMetadataOptions = {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
};

export function buildOgImageUrl(params: {
  locale: Locale;
  title: string;
  description?: string;
  badge?: string;
  image?: string;
  subtitle?: string;
}) {
  const search = new URLSearchParams({
    locale: params.locale,
    title: truncate(params.title, 80),
  });

  if (params.description) {
    search.set('description', truncate(params.description, 140));
  }
  if (params.badge) search.set('badge', truncate(params.badge, 40));
  if (params.subtitle) search.set('subtitle', truncate(params.subtitle, 60));
  if (params.image) search.set('image', params.image);

  return absoluteUrl(`/api/og?${search.toString()}`);
}

export function defaultOgImageUrl(locale: Locale) {
  return buildOgImageUrl({
    locale,
    title: 'Print 8',
    description:
      locale === 'mk'
        ? 'Визит карти, покани, маици, чашки и персонализирани производи.'
        : 'Business cards, invitations, apparel, mugs and personalized products.',
    badge: locale === 'mk' ? 'Печатница' : 'Print shop',
    subtitle: locale === 'mk' ? 'Професионално печатење' : 'Professional printing',
  });
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path = '',
  image,
  type = 'website',
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const siteUrl = getSiteUrl();
  const pagePath = localePath(locale, path);
  const url = `${siteUrl}${pagePath}`;
  const ogImage = image ?? defaultOgImageUrl(locale);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        mk: `${siteUrl}${localePath('mk', path)}`,
        en: `${siteUrl}${localePath('en', path)}`,
      },
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      locale: openGraphLocale(locale),
      alternateLocale: [openGraphLocale(locale === 'mk' ? 'en' : 'mk')],
      url,
      title,
      description,
      siteName: 'Print 8',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
