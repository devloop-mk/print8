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
  notes: string | null;
  itemsJson: string;
  fileIdsJson: string | null;
  totalAmount: number;
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
  notes: string | null;
  items: unknown;
  file_ids: unknown;
  total_amount: number;
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
    notes: row.notes,
    itemsJson: JSON.stringify(row.items ?? []),
    fileIdsJson: row.file_ids ? JSON.stringify(row.file_ids) : null,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
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

export const db = {
  orders: {
    async insert(value: OrderRecord) {
      const { error } = await getSupabaseAdmin().from('orders').insert({
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
        notes: value.notes,
        items: JSON.parse(value.itemsJson),
        file_ids: value.fileIdsJson ? JSON.parse(value.fileIdsJson) : [],
        total_amount: value.totalAmount,
        created_at: value.createdAt,
      });
      if (error) throw new Error(error.message);
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

    async incrementUploadCount(id: string) {
      // read current count and update (not fully atomic but acceptable for most cases)
      const { data, error: selErr } = await getSupabaseAdmin()
        .from('upload_sessions')
        .select('upload_count')
        .eq('id', id)
        .single();
      if (selErr) throw new Error(selErr.message);
      const current = (data?.upload_count as number) || 0;
      const { error } = await getSupabaseAdmin()
        .from('upload_sessions')
        .update({ upload_count: current + 1 })
        .eq('id', id);
      if (error) throw new Error(error.message);
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
