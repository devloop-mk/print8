import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server-auth';
import { customersDb, type CustomerRecord } from '@/lib/db/customers';
import { normalizeCustomerEmail } from '@/lib/loyalty/points';

export type CustomerSession = {
  userId: string;
  email: string;
  customer: CustomerRecord;
};

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) return null;

  const customer = await customersDb.ensureProfile({
    id: data.user.id,
    email: data.user.email,
    fullName:
      typeof data.user.user_metadata?.full_name === 'string'
        ? data.user.user_metadata.full_name
        : null,
  });

  await customersDb.linkPastOrders(customer.id, customer.email);

  return {
    userId: data.user.id,
    email: data.user.email,
    customer,
  };
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
