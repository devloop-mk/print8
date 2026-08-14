import { NextRequest, NextResponse } from 'next/server';
import { cleanupOrphanUploads } from '@/lib/upload/cleanup-orphans';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;

  const header = request.headers.get('x-cron-secret');
  return header === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const result = await cleanupOrphanUploads({ dryRun });

    console.info('[cron/cleanup-orphan-uploads]', result);

    return NextResponse.json({ ok: true, dryRun, ...result });
  } catch (error) {
    console.error('[cron/cleanup-orphan-uploads]', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
