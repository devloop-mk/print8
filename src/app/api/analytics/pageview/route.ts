import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  VISITOR_COOKIE_NAME,
  VISITOR_TTL_SECONDS,
} from '@/lib/analytics/constants';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const BLOCKED_PREFIXES = ['/admin', '/api', '/_next'];
const MAX_PAGEVIEW_BODY_BYTES = 4_096;

function isTrackablePath(path: string) {
  if (!path.startsWith('/')) return false;
  return !BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getVisitorId(request: NextRequest) {
  return request.cookies.get(VISITOR_COOKIE_NAME)?.value ?? null;
}

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'pageview', 180, 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_PAGEVIEW_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    const body = JSON.parse(rawBody) as {
      path?: string;
      locale?: string | null;
    };

    const path = body.path?.trim();
    if (!path || !isTrackablePath(path)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const locale =
      body.locale === 'mk' || body.locale === 'en' ? body.locale : null;
    const existingVisitorId = getVisitorId(request);
    const visitorId = existingVisitorId ?? nanoid();

    const referrer = request.headers.get('referer');

    await db.pageViews.insert({
      id: nanoid(),
      path,
      locale,
      visitorId,
      referrer: referrer?.slice(0, 500) ?? null,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({ ok: true });
    if (!existingVisitorId) {
      response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: VISITOR_TTL_SECONDS,
      });
    }
    return response;
  } catch (error) {
    console.error('[analytics] pageview failed:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
