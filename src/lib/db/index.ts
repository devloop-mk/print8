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
  mimeType: string;
  size: number;
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
  mime_type: string;
  size: number;
  created_at: string;
}): UploadedFileRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    originalName: row.original_name,
    storedName: row.stored_name,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  };
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
      return data as OrderRecord | null;
    },

    async list() {
      const { data, error } = await getSupabaseAdmin()
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data as OrderRecord[];
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
      const { error } = await getSupabaseAdmin().from('uploaded_files').insert({
        id: value.id,
        session_id: value.sessionId,
        original_name: value.originalName,
        stored_name: value.storedName,
        mime_type: value.mimeType,
        size: value.size,
        created_at: value.createdAt,
      });
      if (error) throw new Error(error.message);
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
};

export { nanoid };
