import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';
import { formatSupabaseError } from '@/lib/supabase/client';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'auth-reset-password',
    10,
    15 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Reset session expired', code: 'no_session' },
        { status: 401 },
      );
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/reset-password] error:', error);
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }
}
