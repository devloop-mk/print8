import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import {
  PAGE_VIEW_DEDUP_SECONDS,
  VISITOR_COOKIE_NAME,
  VISITOR_TTL_SECONDS,
} from '@/lib/analytics/constants';
import { db } from '@/lib/db';

const BLOCKED_PREFIXES = ['/admin', '/api', '/_next'];

function isTrackablePath(path: string) {
  if (!path.startsWith('/')) return false;
  return !BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getVisitorId(request: NextRequest) {
  return request.cookies.get(VISITOR_COOKIE_NAME)?.value ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
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

    const isDuplicate = await db.pageViews.hasRecentView(
      visitorId,
      path,
      PAGE_VIEW_DEDUP_SECONDS,
    );

    if (isDuplicate) {
      const response = NextResponse.json({ ok: true, deduped: true });
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
    }

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
