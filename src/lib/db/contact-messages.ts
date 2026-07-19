import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';

export type ContactMessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string | null;
  status: ContactMessageStatus;
  ipHash: string | null;
  createdAt: string;
}

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string | null;
  status: ContactMessageStatus;
  ip_hash: string | null;
  created_at: string;
};

function mapRow(row: ContactMessageRow): ContactMessageRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    locale: row.locale,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
  };
}

export function hashClientIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function insertContactMessage(input: {
  name: string;
  email: string;
  message: string;
  locale?: string | null;
  ipHash?: string | null;
}): Promise<ContactMessageRecord> {
  const id = nanoid();
  const createdAt = new Date().toISOString();
  const row = {
    id,
    name: input.name,
    email: input.email,
    message: input.message,
    locale: input.locale ?? null,
    status: 'new' as const,
    ip_hash: input.ipHash ?? null,
    created_at: createdAt,
  };

  const { error } = await getSupabaseAdmin()
    .from('contact_messages')
    .insert(row);

  if (error) throw new Error(error.message);
  return mapRow(row);
}

export async function listContactMessages(options?: {
  status?: ContactMessageStatus | 'all';
  limit?: number;
}): Promise<ContactMessageRecord[]> {
  let query = getSupabaseAdmin()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ContactMessageRow[]).map(mapRow);
}

export async function getContactMessage(
  id: string,
): Promise<ContactMessageRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data ? mapRow(data as ContactMessageRow) : null;
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('contact_messages')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function countNewContactMessages(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');

  if (error) throw new Error(error.message);
  return count ?? 0;
}
