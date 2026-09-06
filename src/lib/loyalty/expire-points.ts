import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function expireCustomerPoints(customerId: string): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    'expire_loyalty_point_lots_for_customer',
    { p_customer_id: customerId },
  );

  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function expireAllCustomerPoints(): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    'expire_loyalty_point_lots_all',
  );

  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
