import { getSupabaseAdmin } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'printing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'cod';
  locale: 'mk' | 'en';
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerCity: string;
  customerAddress: string;
  fulfillmentMethod: 'cargo' | 'pickup';
  notes: string | null;
  itemsJson: string;
  fileIdsJson: string | null;
  totalAmount: number;
  subtotalAmount?: number | null;
  discountAmount?: number | null;
  couponCode?: string | null;
  customerId?: string | null;
  pointsRedeemed?: number;
  pointsDiscountAmount?: number;
  pointsEarned?: number | null;
  pointsAwardedAt?: string | null;
  pointsFirstOrderBonus?: number;
  createdAt: string;
}

export interface UploadSessionRecord {
  id: string;
  token: string;
  expiresAt: string;
  uploadCount: number;
  createdAt: string;
}

export interface UploadedFileRecord {
  id: string;
  sessionId: string;
  originalName: string;
  storedName: string;
  /** Full-quality original in storage (images only) */
  originalStoredName: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface PageViewRecord {
  id: string;
  path: string;
  locale: string | null;
  visitorId: string;
  referrer: string | null;
  createdAt: string;
}

function mapUploadSession(row: {
  id: string;
  token: string;
  expires_at: string;
  upload_count: number;
  created_at: string;
}): UploadSessionRecord {
  return {
    id: row.id,
    token: row.token,
    expiresAt: row.expires_at,
    uploadCount: row.upload_count ?? 0,
    createdAt: row.created_at,
  };
}

function mapUploadedFile(row: {
  id: string;
  session_id: string;
  original_name: string;
  stored_name: string;
  original_stored_name?: string | null;
  mime_type: string;
  size: number;
  created_at: string;
}): UploadedFileRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    originalName: row.original_name,
    storedName: row.stored_name,
    originalStoredName: row.original_stored_name ?? null,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  };
}

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: 'cod';
  locale: 'mk' | 'en';
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_city: string;
  customer_address: string;
  fulfillment_method?: 'cargo' | 'pickup' | null;
  notes: string | null;
  items: unknown;
  file_ids: unknown;
  total_amount: number;
  subtotal_amount?: number | string | null;
  discount_amount?: number | string | null;
  coupon_code?: string | null;
  customer_id?: string | null;
  points_redeemed?: number | string | null;
  points_discount_amount?: number | string | null;
  points_earned?: number | string | null;
  points_awarded_at?: string | null;
  points_first_order_bonus?: number | string | null;
  created_at: string;
};

function mapOrderRow(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentMethod: row.payment_method,
    locale: row.locale,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    customerCity: row.customer_city,
    customerAddress: row.customer_address,
    fulfillmentMethod:
      row.fulfillment_method === 'pickup' ? 'pickup' : 'cargo',
    notes: row.notes,
    itemsJson: JSON.stringify(row.items ?? []),
    fileIdsJson: row.file_ids ? JSON.stringify(row.file_ids) : null,
    totalAmount: Number(row.total_amount),
    subtotalAmount:
      row.subtotal_amount == null ? null : Number(row.subtotal_amount),
    discountAmount:
      row.discount_amount == null ? null : Number(row.discount_amount),
    couponCode: row.coupon_code ?? null,
    customerId: row.customer_id ?? null,
    pointsRedeemed:
      row.points_redeemed == null ? 0 : Number(row.points_redeemed),
    pointsDiscountAmount:
      row.points_discount_amount == null
        ? 0
        : Number(row.points_discount_amount),
    pointsEarned:
      row.points_earned == null ? null : Number(row.points_earned),
    pointsAwardedAt: row.points_awarded_at ?? null,
    pointsFirstOrderBonus: Number(row.points_first_order_bonus ?? 0),
    createdAt: row.created_at,
  };
}

/** Lean row shape for admin dashboard metrics (avoids customer fields + stringify round-trip). */
export type OrderMetricsRow = {
  status: OrderStatus;
  locale: 'mk' | 'en';
  totalAmount: number;
  createdAt: string;
  /** Parsed once from DB jsonb; only `type` + `quantity` are used by metrics. */
  items: Array<{ type: 'service' | 'design' | 'product'; quantity: number }>;
};

type OrderMetricsDbRow = {
  status: OrderStatus;
  locale: 'mk' | 'en';
  total_amount: number;
  created_at: string;
  items: unknown;
};

function mapOrderMetricsRow(row: OrderMetricsDbRow): OrderMetricsRow {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items: OrderMetricsRow['items'] = [];

  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const type = record.type;
    const quantity = Number(record.quantity);
    if (
      (type === 'service' || type === 'design' || type === 'product') &&
      Number.isFinite(quantity) &&
      quantity > 0
    ) {
      items.push({ type, quantity });
    }
  }

  return {
    status: row.status,
    locale: row.locale,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    items,
  };
}

function isMissingOriginalStoredNameColumn(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('original_stored_name') ||
    lower.includes("column 'original_stored_name'") ||
    lower.includes('schema cache')
  );
}

/** Compare phones loosely (ignore spaces, dashes, leading +389 / 0). */
export function phonesMatch(stored: string, input: string): boolean {
  const normalize = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('389')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    return digits;
  };

  const a = normalize(stored);
  const b = normalize(input);
  if (!a || !b) return false;
  if (a === b) return true;
  const len = Math.min(8, a.length, b.length);
  return len >= 8 && a.slice(-len) === b.slice(-len);
}

export const db = {
  orders: {
    async insert(value: OrderRecord) {
      const payload: Record<string, unknown> = {
        id: value.id,
        order_number: value.orderNumber,
        status: value.status,
        payment_method: value.paymentMethod,
        locale: value.locale,
        customer_name: value.customerName,
        customer_phone: value.customerPhone,
        customer_email: value.customerEmail,
        customer_city: value.customerCity,
        customer_address: value.customerAddress,
        fulfillment_method: value.fulfillmentMethod,
        notes: value.notes,
        items: JSON.parse(value.itemsJson),
        file_ids: value.fileIdsJson ? JSON.parse(value.fileIdsJson) : [],
        total_amount: value.totalAmount,
        created_at: value.createdAt,
      };

      if (value.subtotalAmount != null) payload.subtotal_amount = value.subtotalAmount;
      if (value.discountAmount != null) payload.discount_amount = value.discountAmount;
      if (value.couponCode) payload.coupon_code = value.couponCode;
      if (value.customerId) payload.customer_id = value.customerId;
      if (value.pointsRedeemed != null && value.pointsRedeemed > 0) {
        payload.points_redeemed = value.pointsRedeemed;
      }
      if (value.pointsDiscountAmount != null && value.pointsDiscountAmount > 0) {
        payload.points_discount_amount = value.pointsDiscountAmount;
      }

      const { error } = await getSupabaseAdmin().from('orders').insert(payload);
      if (!error) return;

      const message = error.message.toLowerCase();
      // Migration not applied yet — strip newer columns and retry.
      if (
        message.includes('fulfillment_method') ||
        message.includes('coupon_code') ||
        message.includes('discount_amount') ||
        message.includes('subtotal_amount') ||
        message.includes('customer_id') ||
        message.includes('points_redeemed') ||
        message.includes('points_discount_amount') ||
        message.includes('schema cache')
      ) {
        const {
          fulfillment_method: _f,
          coupon_code: _c,
          discount_amount: _d,
          subtotal_amount: _s,
          ...legacy
        } = payload;
        const retry = await getSupabaseAdmin().from('orders').insert(legacy);
        if (retry.error) throw new Error(retry.error.message);
        return;
      }

      throw new Error(error.message);
    },

    async findByOrderNumber(orderNumber: string) {
      const { data, error } = await getSupabaseAdmin()
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      return data ? mapOrderRow(data as OrderRow) : null;
    },

    async findByOrderNumberAndPhone(orderNumber: string, phone: string) {
      const order = await this.findByOrderNumber(orderNumber.trim());
      if (!order) return null;
      if (!phonesMatch(order.customerPhone, phone)) return null;
      return order;
    },

    async findById(id: string) {
      const { data, error } = await getSupabaseAdmin()
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      return data ? mapOrderRow(data as OrderRow) : null;
    },

    async updateStatus(id: string, status: OrderStatus) {
      const { data, error } = await getSupabaseAdmin()
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapOrderRow(data as OrderRow);
    },

    async list(options?: {
      status?: OrderStatus | 'all';
      sort?: 'newest' | 'oldest' | 'amount_high' | 'amount_low';
      search?: string;
      limit?: number;
    }) {
      let query = getSupabaseAdmin().from('orders').select('*');

      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      const sort = options?.sort ?? 'newest';
      if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sort === 'amount_high') {
        query = query.order('total_amount', { ascending: false });
      } else if (sort === 'amount_low') {
        query = query.order('total_amount', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let rows = (data as OrderRow[]).map(mapOrderRow);
      const search = options?.search?.trim().toLowerCase();
      if (search) {
        rows = rows.filter((row) => {
          const haystack = [
            row.orderNumber,
            row.customerName,
            row.customerPhone,
            row.customerEmail ?? '',
            row.customerCity,
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        });
      }

      return rows;
    },

    async listForMetrics(): Promise<OrderMetricsRow[]> {
      const { data, error } = await getSupabaseAdmin()
        .from('orders')
        .select('status, locale, total_amount, created_at, items')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as OrderMetricsDbRow[]).map(mapOrderMetricsRow);
    },
  },

  uploadSessions: {
    async insert(value: UploadSessionRecord) {
      const { error } = await getSupabaseAdmin().from('upload_sessions').insert({
        id: value.id,
        token: value.token,
        expires_at: value.expiresAt,
        upload_count: value.uploadCount,
        created_at: value.createdAt,
      });
      if (error) throw new Error(error.message);
    },

    async findByToken(token: string) {
      const { data, error } = await getSupabaseAdmin()
        .from('upload_sessions')
        .select('*')
        .eq('token', token)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      if (!data) return null;
      if (new Date(data.expires_at) <= new Date()) return null;
      return mapUploadSession(data);
    },

    async incrementUploadCount(id: string, maxCount: number): Promise<boolean> {
      const { data, error } = await getSupabaseAdmin().rpc(
        'increment_upload_session_count',
        { p_session_id: id, p_max_count: maxCount },
      );
      if (error) {
        // Fallback when migration not applied yet (optimistic compare-and-swap).
        if (error.message.includes('increment_upload_session_count')) {
          const { data: row, error: selErr } = await getSupabaseAdmin()
            .from('upload_sessions')
            .select('upload_count')
            .eq('id', id)
            .single();
          if (selErr) throw new Error(selErr.message);
          const current = (row?.upload_count as number) || 0;
          if (current >= maxCount) return false;
          const { data: updated, error: updErr } = await getSupabaseAdmin()
            .from('upload_sessions')
            .update({ upload_count: current + 1 })
            .eq('id', id)
            .eq('upload_count', current)
            .select('id')
            .maybeSingle();
          if (updErr) throw new Error(updErr.message);
          return Boolean(updated);
        }
        throw new Error(error.message);
      }
      return Boolean(data);
    },
  },

  uploadedFiles: {
    async insert(value: UploadedFileRecord) {
      const baseRow = {
        id: value.id,
        session_id: value.sessionId,
        original_name: value.originalName,
        stored_name: value.storedName,
        mime_type: value.mimeType,
        size: value.size,
        created_at: value.createdAt,
      };

      const { error: fullError } = await getSupabaseAdmin()
        .from('uploaded_files')
        .insert({
          ...baseRow,
          original_stored_name: value.originalStoredName,
        });

      if (!fullError) return;

      if (isMissingOriginalStoredNameColumn(fullError.message)) {
        const { error: fallbackError } = await getSupabaseAdmin()
          .from('uploaded_files')
          .insert(baseRow);
        if (!fallbackError) return;
        throw new Error(fallbackError.message);
      }

      throw new Error(fullError.message);
    },

    async findById(id: string) {
      const { data, error } = await getSupabaseAdmin()
        .from('uploaded_files')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }
      if (!data) return null;
      return mapUploadedFile(data);
    },
  },

  pageViews: {
    async insert(value: PageViewRecord) {
      const { error } = await getSupabaseAdmin().from('page_views').insert({
        id: value.id,
        path: value.path,
        locale: value.locale,
        visitor_id: value.visitorId,
        referrer: value.referrer,
        created_at: value.createdAt,
      });
      if (error) throw new Error(error.message);
    },

    async hasRecentView(visitorId: string, path: string, withinSeconds: number) {
      const since = new Date(Date.now() - withinSeconds * 1000).toISOString();
      const { data, error } = await getSupabaseAdmin()
        .from('page_views')
        .select('id')
        .eq('visitor_id', visitorId)
        .eq('path', path)
        .gte('created_at', since)
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return Boolean(data);
    },

    async listSince(since: string) {
      const { data, error } = await getSupabaseAdmin()
        .from('page_views')
        .select('path, locale, visitor_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      return (data ?? []).map((row) => ({
        path: row.path as string,
        locale: (row.locale as string | null) ?? null,
        visitorId: row.visitor_id as string,
        createdAt: row.created_at as string,
      }));
    },
  },
};

export { nanoid };
