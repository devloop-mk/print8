import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';
import { formatSupabaseError } from '@/lib/supabase/client';
import { customersDb } from '@/lib/db/customers';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'auth-login', 15, 15 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid login data' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const { email, password } = parsed.data;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user?.email) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const customer = await customersDb.ensureProfile({
      id: data.user.id,
      email: data.user.email,
      fullName:
        typeof data.user.user_metadata?.full_name === 'string'
          ? data.user.user_metadata.full_name
          : null,
    });
    await customersDb.linkPastOrders(customer.id, customer.email);

    return NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        pointsBalance: customer.pointsBalance,
        pointsPendingBalance: customer.pointsPendingBalance,
        firstOrderBonusGranted: customer.firstOrderBonusGranted,
      },
    });
  } catch (error) {
    console.error('[auth/login] error:', error);
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }
}
