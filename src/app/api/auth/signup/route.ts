import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';
import { formatSupabaseError } from '@/lib/supabase/client';
import { customersDb } from '@/lib/db/customers';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(100),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'auth-signup', 8, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid signup data' }, { status: 400 });
    }

    const supabase = await createSupabaseRouteHandlerClient();
    const { email, password, fullName } = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Account could not be created. Try again.' },
        { status: 400 },
      );
    }

    const needsEmailConfirmation = !data.session;

    if (data.user.id && data.user.email) {
      try {
        await customersDb.ensureProfile({
          id: data.user.id,
          email: data.user.email,
          fullName,
        });
      } catch (profileError) {
        // Auth user already exists (email may have been sent). Profile is created
        // on login or by the on_auth_user_created trigger after migration.
        console.error('[auth/signup] ensureProfile failed:', profileError);
        if (!needsEmailConfirmation) {
          return NextResponse.json(
            { error: formatSupabaseError(profileError) },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation,
    });
  } catch (error) {
    console.error('[auth/signup] unexpected error:', error);
    return NextResponse.json(
      { error: formatSupabaseError(error) },
      { status: 500 },
    );
  }
}
