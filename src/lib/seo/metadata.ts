import type { Metadata } from 'next';
import type { Locale } from '@/i18n/navigation';
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

/**
 * OG image for design/product-design share pages that need to show *two*
 * raster images side by side (dual-sided front+back designs, or couple-pack
 * partner designs). Delegates to the sharp-based `/api/og/design` route,
 * which ONLY composites raster (png/jpg/webp) images — never SVG — onto a
 * static branded background. Inputs should already be resolved via
 * `resolveAssetUrl` (site-relative path or absolute CDN URL); the route
 * reads local `public/` assets straight off disk and only fetches over HTTP
 * for already-absolute (CDN) URLs.
 */
export function buildDesignOgImageUrl(images: Array<string | undefined | null>) {
  const [a, b] = images.filter((value): value is string => Boolean(value));
  const search = new URLSearchParams();
  if (a) search.set('a', a);
  if (b) search.set('b', b);
  return absoluteUrl(`/api/og/design?${search.toString()}`);
}

/**
 * Site-wide default og:image. This is a static, pre-generated JPG committed
 * to `public/og/` — never the dynamic `/api/og` route — so Facebook/Viber/
 * Telegram/etc. crawlers always get a real `image/jpeg` with no server-side
 * rendering, remote font/asset fetches, or preview-deployment dependency in
 * the critical path.
 */
export function defaultOgImageUrl(_locale?: Locale) {
  return absoluteUrl('/og/default.jpg');
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
