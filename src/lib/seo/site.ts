import type { Locale } from '@/i18n/navigation';

const DEFAULT_SITE_URL = 'https://print8.mk';

/**
 * Resolve the canonical site origin used to build absolute metadata/og:image
 * URLs. This must NEVER resolve to an ephemeral per-deployment preview
 * hostname (e.g. `print8-rhcs0jart-viktors-projects-....vercel.app`) — social
 * crawlers (Facebook/Viber/Telegram) frequently fail to fetch those, and the
 * URL itself changes on every deploy so cached previews go stale instantly.
 *
 * Priority order:
 * 1. `NEXT_PUBLIC_SITE_URL` — explicit override, always wins when set.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel's *stable* production domain
 *    for this project (e.g. `print8.vercel.app`). Vercel sets this on every
 *    deployment (production AND preview), so using it means preview builds
 *    still generate metadata pointing at the real canonical host instead of
 *    the throwaway `VERCEL_URL` for that specific deployment.
 * 3. Local dev fallback (`localhost`).
 * 4. `VERCEL_URL` — last resort only; this is the ephemeral deployment URL
 *    and should rarely be reached once (1)/(2) are configured.
 * 5. Hardcoded production domain fallback.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const stableProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (stableProductionHost) {
    return `https://${stableProductionHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  }

  // In local dev, fall back to localhost instead of the production domain so
  // OG/asset URLs built during `next dev` resolve to this machine instead of
  // silently depending on network access to the live site.
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT?.trim() || '3000';
    return `http://localhost:${port}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

/**
 * Like `absoluteUrl`, but safe to call on values that may already be fully
 * qualified (e.g. CDN asset URLs from `resolveAssetUrl`). Passing an
 * already-absolute URL through `absoluteUrl` would incorrectly re-prefix it
 * with the site origin.
 */
export function toAbsoluteAssetUrl(url: string) {
  if (/^(https?:|data:)/i.test(url)) return url;
  return absoluteUrl(url);
}

export function localePath(locale: Locale, path = '') {
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `/${locale}${normalized}`;
}

export function openGraphLocale(locale: Locale) {
  return locale === 'mk' ? 'mk_MK' : 'en_US';
}
