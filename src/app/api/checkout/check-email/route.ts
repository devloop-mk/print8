import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { customersDb } from '@/lib/db/customers';
import { getCustomerSignInMethods } from '@/lib/auth/customer-sign-in-methods';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { createSupabaseRequestClient } from '@/lib/supabase/server-auth';

const checkEmailSchema = z.object({
  email: z.string().trim().email().max(254),
});

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
      return NextResponse.json({ exists: false, authenticated: true });
    }

    const body = await request.json();
    const parsed = checkEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const customer = await customersDb.findByEmailNormalized(parsed.data.email);
    if (!customer) {
      return NextResponse.json({ exists: false });
    }

    const signInMethods = await getCustomerSignInMethods(customer.id);
    return NextResponse.json({
      exists: true,
      signInMethods,
    });
  } catch (error) {
    console.error('[checkout/check-email] error:', error);
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}
