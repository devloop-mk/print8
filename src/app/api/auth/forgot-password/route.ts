import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestOrigin } from '@/lib/auth/oauth';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';
import { formatSupabaseError } from '@/lib/supabase/client';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'auth-forgot-password',
    5,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const origin = getRequestOrigin(request);
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${origin}/auth/callback?type=recovery`,
      },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/forgot-password] error:', error);
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }
}
