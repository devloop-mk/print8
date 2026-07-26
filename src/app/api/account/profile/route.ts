import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/auth/customer';
import { customersDb } from '@/lib/db/customers';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  defaultCity: z.string().trim().max(100).optional(),
  defaultAddress: z.string().trim().max(300).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }

    const customer = await customersDb.updateProfile(session.customer.id, {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      defaultCity: parsed.data.defaultCity,
      defaultAddress: parsed.data.defaultAddress,
    });

    return NextResponse.json({ customer });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
