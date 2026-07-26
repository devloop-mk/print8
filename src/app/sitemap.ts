import type { MetadataRoute } from 'next';
import { products } from '@/lib/data/catalog';
import { couplePackTemplates } from '@/lib/data/couple-pack';
import { LEGAL_PAGE_PATHS } from '@/lib/legal/pages';
import { routing } from '@/i18n/routing';
import { getSiteUrl, localePath } from '@/lib/seo/site';
import type { Locale } from '@/i18n/routing';

const STATIC_PATHS = [
  '',
  '/products',
  '/products/ready-designs',
  '/products/ready-designs/kids',
  '/products/ready-designs/couples',
  '/products/custom',
  '/designs',
  '/designs/all',
  '/designs/custom',
  '/services',
  '/search',
  '/contact',
  '/about',
  '/faq',
  '/how-to-order',
  '/loyalty-points',
  '/order-status',
  '/rewards',
] as const;

function entry(
  locale: Locale,
  path: string,
  options?: { changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; priority?: number },
): MetadataRoute.Sitemap[number] {
  const siteUrl = getSiteUrl();
  return {
    url: `${siteUrl}${localePath(locale, path)}`,
    lastModified: new Date(),
    changeFrequency: options?.changeFrequency ?? 'weekly',
    priority: options?.priority ?? 0.7,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `${siteUrl}${localePath(loc, path)}`]),
      ),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push(
        entry(locale, path, {
          priority: path === '' ? 1 : 0.8,
          changeFrequency: path === '' ? 'daily' : 'weekly',
        }),
      );
    }

    for (const product of products) {
      entries.push(entry(locale, `/products/${product.id}`, { priority: 0.6 }));
      entries.push(
        entry(locale, `/products/${product.id}/designs`, {
          priority: 0.5,
          changeFrequency: 'weekly',
        }),
      );
    }

    for (const pack of couplePackTemplates) {
      entries.push(
        entry(locale, `/products/design/couple/${pack.id}`, { priority: 0.5 }),
      );
    }

    for (const legalPath of Object.values(LEGAL_PAGE_PATHS)) {
      entries.push(
        entry(locale, legalPath, {
          priority: 0.3,
          changeFrequency: 'yearly',
        }),
      );
    }
  }

  return entries;
}
