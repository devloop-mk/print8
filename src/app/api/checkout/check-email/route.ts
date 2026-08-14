import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { createSupabaseRequestClient } from '@/lib/supabase/server-auth';

const checkEmailSchema = z.object({
  email: z.string().trim().email().max(254),
});

/** Validates email shape only — never reveals whether an account exists. */
export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'checkout-check-email',
    30,
    15 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const supabase = createSupabaseRequestClient(request);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user?.email) {
      return NextResponse.json({ ok: true, authenticated: true });
    }

    const body = await request.json();
    const parsed = checkEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[checkout/check-email] error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
