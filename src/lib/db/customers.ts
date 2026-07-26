import { getSupabaseAdmin } from '@/lib/supabase/client';
import { normalizeCustomerEmail } from '@/lib/loyalty/points';

export type CustomerRecord = {
  id: string;
  email: string;
  emailNormalized: string;
  fullName: string | null;
  phone: string | null;
  defaultCity: string | null;
  defaultAddress: string | null;
  pointsBalance: number;
  pointsPendingBalance: number;
  firstOrderBonusGranted: boolean;
  createdAt: string;
  updatedAt: string;
};

type CustomerRow = {
  id: string;
  email: string;
  email_normalized: string;
  full_name: string | null;
  phone: string | null;
  default_city: string | null;
  default_address: string | null;
  points_balance: number;
  points_pending_balance: number;
  first_order_bonus_granted: boolean;
  created_at: string;
  updated_at: string;
};

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    fullName: row.full_name,
    phone: row.phone,
    defaultCity: row.default_city,
    defaultAddress: row.default_address,
    pointsBalance: Number(row.points_balance ?? 0),
    pointsPendingBalance: Number(row.points_pending_balance ?? 0),
    firstOrderBonusGranted: Boolean(row.first_order_bonus_granted),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const customersDb = {
  async findById(id: string): Promise<CustomerRecord | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapCustomer(data as CustomerRow) : null;
  },

  async findByEmailNormalized(email: string): Promise<CustomerRecord | null> {
    const normalized = normalizeCustomerEmail(email);
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select('*')
      .eq('email_normalized', normalized)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapCustomer(data as CustomerRow) : null;
  },

  async ensureProfile(input: {
    id: string;
    email: string;
    fullName?: string | null;
    phone?: string | null;
  }): Promise<CustomerRecord> {
    const email = input.email.trim();
    const emailNormalized = normalizeCustomerEmail(email);
    const now = new Date().toISOString();

    const existing = await this.findById(input.id);
    if (existing) {
      const { data, error } = await getSupabaseAdmin()
        .from('customers')
        .update({
          email,
          email_normalized: emailNormalized,
          full_name: input.fullName ?? existing.fullName,
          phone: input.phone ?? existing.phone,
          updated_at: now,
        })
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return mapCustomer(data as CustomerRow);
    }

    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .insert({
        id: input.id,
        email,
        email_normalized: emailNormalized,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
        points_balance: 0,
        points_pending_balance: 0,
        first_order_bonus_granted: false,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapCustomer(data as CustomerRow);
  },

  async updateProfile(
    id: string,
    patch: {
      fullName?: string | null;
      phone?: string | null;
      defaultCity?: string | null;
      defaultAddress?: string | null;
    },
  ): Promise<CustomerRecord> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.fullName !== undefined) payload.full_name = patch.fullName;
    if (patch.phone !== undefined) payload.phone = patch.phone;
    if (patch.defaultCity !== undefined) payload.default_city = patch.defaultCity;
    if (patch.defaultAddress !== undefined) {
      payload.default_address = patch.defaultAddress;
    }

    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapCustomer(data as CustomerRow);
  },

  async markFirstOrderBonusGranted(id: string): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from('customers')
      .update({
        first_order_bonus_granted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async linkPastOrders(customerId: string, email: string): Promise<void> {
    const normalized = normalizeCustomerEmail(email);
    const { error } = await getSupabaseAdmin()
      .from('orders')
      .update({ customer_id: customerId })
      .is('customer_id', null)
      .ilike('customer_email', normalized);

    if (error) throw new Error(error.message);
  },

  async listOrders(customerId: string, limit = 50) {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .select(
        'id, order_number, status, total_amount, subtotal_amount, discount_amount, points_redeemed, points_discount_amount, points_earned, points_awarded_at, created_at',
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id as string,
      orderNumber: row.order_number as string,
      status: row.status as string,
      totalAmount: Number(row.total_amount),
      subtotalAmount:
        row.subtotal_amount == null ? null : Number(row.subtotal_amount),
      discountAmount:
        row.discount_amount == null ? null : Number(row.discount_amount),
      pointsRedeemed: Number(row.points_redeemed ?? 0),
      pointsDiscountAmount: Number(row.points_discount_amount ?? 0),
      pointsEarned:
        row.points_earned == null ? null : Number(row.points_earned),
      pointsAwardedAt: (row.points_awarded_at as string | null) ?? null,
      createdAt: row.created_at as string,
    }));
  },
};
