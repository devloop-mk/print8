import { absoluteUrl } from '@/lib/seo/site';

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

function collectAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      hosts.add(new URL(site).host);
    } catch {
      /* ignore */
    }
  }

  const cdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.trim();
  if (cdn) {
    try {
      hosts.add(new URL(cdn).host);
    } catch {
      /* ignore */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    hosts.add(vercel.replace(/^https?:\/\//, '').split('/')[0] ?? vercel);
  }

  try {
    hosts.add(new URL(absoluteUrl('/')).host);
  } catch {
    /* ignore */
  }

  return hosts;
}

const ALLOWED_HOSTS = collectAllowedHosts();

export function isAllowedOgRasterUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    if (isProductionRuntime()) {
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('.local')
      ) {
        return false;
      }
    }

    return ALLOWED_HOSTS.has(parsed.host);
  } catch {
    return false;
  }
}
