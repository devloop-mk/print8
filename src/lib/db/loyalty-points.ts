import { nanoid } from 'nanoid';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export type LoyaltyTransactionType =
  | 'earn'
  | 'redeem'
  | 'refund'
  | 'bonus'
  | 'adjust'
  | 'clawback'
  | 'pending_earn'
  | 'pending_cancel';

export type LoyaltyPointTransaction = {
  id: string;
  customerId: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  orderId: string | null;
  note: string | null;
  createdAt: string;
};

type LoyaltyRow = {
  id: string;
  customer_id: string;
  type: LoyaltyTransactionType;
  points: number;
  balance_after: number;
  order_id: string | null;
  note: string | null;
  created_at: string;
};

function mapTransaction(row: LoyaltyRow): LoyaltyPointTransaction {
  return {
    id: row.id,
    customerId: row.customer_id,
    type: row.type,
    points: Number(row.points),
    balanceAfter: Number(row.balance_after),
    orderId: row.order_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function adjustCustomerPoints(input: {
  customerId: string;
  delta: number;
  type: LoyaltyTransactionType;
  orderId?: string | null;
  note?: string | null;
  idempotencyKey?: string | null;
}): Promise<{ transactionId: string; balanceAfter: number }> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error('invalid_points_delta');
  }

  const transactionId = nanoid();
  const { data, error } = await getSupabaseAdmin().rpc('adjust_customer_points', {
    p_transaction_id: transactionId,
    p_customer_id: input.customerId,
    p_delta: input.delta,
    p_type: input.type,
    p_order_id: input.orderId ?? null,
    p_note: input.note ?? null,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('insufficient_points')) {
      throw new Error('insufficient_points');
    }
    if (message.includes('customer_not_found')) {
      throw new Error('customer_not_found');
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('loyalty_rpc_failed');
  }

  const record = row as { transaction_id: string; balance_after: number };
  return {
    transactionId: record.transaction_id,
    balanceAfter: Number(record.balance_after),
  };
}

export async function adjustCustomerPendingPoints(input: {
  customerId: string;
  delta: number;
  type: 'pending_earn' | 'pending_cancel';
  orderId?: string | null;
  note?: string | null;
  idempotencyKey?: string | null;
}): Promise<{ transactionId: string; pendingBalanceAfter: number }> {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    throw new Error('invalid_points_delta');
  }

  const transactionId = nanoid();
  const { data, error } = await getSupabaseAdmin().rpc(
    'adjust_customer_pending_points',
    {
      p_transaction_id: transactionId,
      p_customer_id: input.customerId,
      p_delta: input.delta,
      p_type: input.type,
      p_order_id: input.orderId ?? null,
      p_note: input.note ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
    },
  );

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('insufficient_pending_points')) {
      throw new Error('insufficient_pending_points');
    }
    if (message.includes('customer_not_found')) {
      throw new Error('customer_not_found');
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('loyalty_rpc_failed');
  }

  const record = row as { transaction_id: string; pending_balance_after: number };
  return {
    transactionId: record.transaction_id,
    pendingBalanceAfter: Number(record.pending_balance_after),
  };
}

export async function releaseCustomerPendingPoints(input: {
  customerId: string;
  amount: number;
  orderId?: string | null;
  note?: string | null;
  idempotencyKey?: string | null;
}): Promise<{
  transactionId: string;
  balanceAfter: number;
  pendingBalanceAfter: number;
}> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('invalid_amount');
  }

  const transactionId = nanoid();
  const { data, error } = await getSupabaseAdmin().rpc(
    'release_customer_pending_points',
    {
      p_transaction_id: transactionId,
      p_customer_id: input.customerId,
      p_amount: input.amount,
      p_order_id: input.orderId ?? null,
      p_note: input.note ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
    },
  );

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('insufficient_pending_points')) {
      throw new Error('insufficient_pending_points');
    }
    if (message.includes('customer_not_found')) {
      throw new Error('customer_not_found');
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    throw new Error('loyalty_rpc_failed');
  }

  const record = row as {
    transaction_id: string;
    balance_after: number;
    pending_balance_after: number;
  };
  return {
    transactionId: record.transaction_id,
    balanceAfter: Number(record.balance_after),
    pendingBalanceAfter: Number(record.pending_balance_after),
  };
}

export async function listCustomerPointTransactions(
  customerId: string,
  limit = 50,
): Promise<LoyaltyPointTransaction[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('loyalty_point_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as LoyaltyRow[]).map(mapTransaction);
}

export async function updateOrderLoyaltyFields(
  orderId: string,
  patch: {
    customerId?: string | null;
    pointsRedeemed?: number;
    pointsDiscountAmount?: number;
    pointsEarned?: number | null;
    pointsAwardedAt?: string | null;
    pointsFirstOrderBonus?: number;
  },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.customerId !== undefined) payload.customer_id = patch.customerId;
  if (patch.pointsRedeemed !== undefined) {
    payload.points_redeemed = patch.pointsRedeemed;
  }
  if (patch.pointsDiscountAmount !== undefined) {
    payload.points_discount_amount = patch.pointsDiscountAmount;
  }
  if (patch.pointsEarned !== undefined) payload.points_earned = patch.pointsEarned;
  if (patch.pointsAwardedAt !== undefined) {
    payload.points_awarded_at = patch.pointsAwardedAt;
  }
  if (patch.pointsFirstOrderBonus !== undefined) {
    payload.points_first_order_bonus = patch.pointsFirstOrderBonus;
  }

  if (Object.keys(payload).length === 0) return;

  const { error } = await getSupabaseAdmin()
    .from('orders')
    .update(payload)
    .eq('id', orderId);

  if (error) throw new Error(error.message);
}
