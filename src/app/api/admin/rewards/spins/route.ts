import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { listRecentSpinPlays, maskEmail } from '@/lib/rewards/spin-play';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const plays = await listRecentSpinPlays(80);
    return NextResponse.json({
      spins: plays.map((play) => ({
        id: play.id,
        emailMasked: maskEmail(play.email),
        prizeKey: play.prizeKey,
        discountAmount: play.discountAmount,
        couponCode: play.couponCode,
        locale: play.locale,
        createdAt: play.createdAt,
      })),
    });
  } catch (err) {
    console.error('[admin/rewards/spins]', err);
    return NextResponse.json(
      {
        error: 'Failed to load spins',
        hint: 'Run supabase/migrations/add-spin-wheel.sql',
      },
      { status: 500 },
    );
  }
}
