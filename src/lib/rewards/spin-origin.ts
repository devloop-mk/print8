import type { NextRequest } from 'next/server';

/** Soft same-site check for public spin API (blocks casual cross-site POSTs). */
export function hasValidSpinOrigin(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (
    fetchSite === 'same-origin' ||
    fetchSite === 'same-site' ||
    fetchSite === 'none'
  ) {
    return true;
  }

  return false;
}
