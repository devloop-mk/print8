import { NextRequest, NextResponse } from 'next/server';
import { expireAllCustomerPoints } from '@/lib/loyalty/expire-points';

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
    const expiredTotal = await expireAllCustomerPoints();
    console.info('[cron/expire-loyalty-points]', { expiredTotal });
    return NextResponse.json({ ok: true, expiredTotal });
  } catch (error) {
    console.error('[cron/expire-loyalty-points]', error);
    return NextResponse.json({ error: 'Expiration failed' }, { status: 500 });
  }
}
