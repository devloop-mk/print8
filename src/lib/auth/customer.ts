import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server-auth';
import { customersDb, type CustomerRecord } from '@/lib/db/customers';
import { normalizeCustomerEmail } from '@/lib/loyalty/points';

export type CustomerSession = {
  userId: string;
  email: string;
  customer: CustomerRecord;
};

function fallbackCustomerRecord(
  id: string,
  email: string,
  fullName: string | null,
): CustomerRecord {
  const now = new Date().toISOString();
  return {
    id,
    email,
    emailNormalized: normalizeCustomerEmail(email),
    fullName,
    phone: null,
    defaultCity: null,
    defaultAddress: null,
    pointsBalance: 0,
    pointsPendingBalance: 0,
    firstOrderBonusGranted: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function resolveCustomerRecord(
  id: string,
  email: string,
  fullName: string | null,
): Promise<CustomerRecord> {
  try {
    return await customersDb.ensureProfile({
      id,
      email,
      fullName,
    });
  } catch (profileError) {
    console.error('[auth] ensureProfile failed:', profileError);
    const existing = await customersDb.findById(id);
    if (existing) return existing;
    return fallbackCustomerRecord(id, email, fullName);
  }
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id || !data.user.email) return null;

    const metadata = data.user.user_metadata;
    const fullNameFromMeta =
      typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : typeof metadata?.name === 'string'
          ? metadata.name
          : null;

    const customer = await resolveCustomerRecord(
      data.user.id,
      data.user.email,
      fullNameFromMeta,
    );

    try {
      await customersDb.linkPastOrders(customer.id, customer.email);
    } catch (linkError) {
      console.error('[auth] linkPastOrders failed:', linkError);
    }

    return {
      userId: data.user.id,
      email: data.user.email,
      customer,
    };
  } catch (error) {
    console.error('[auth] getCustomerSession failed:', error);
    return null;
  }
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) {
    throw new Error('auth_required');
  }
  return session;
}

export function customerEmailMatchesOrder(
  customer: CustomerRecord,
  orderEmail: string,
): boolean {
  return (
    normalizeCustomerEmail(customer.email) === normalizeCustomerEmail(orderEmail)
  );
}
