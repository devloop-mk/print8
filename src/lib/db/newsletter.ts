import { getSupabaseAdmin } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';

export type NewsletterSubscriberStatus = 'active' | 'unsubscribed';

export type NewsletterSubscriber = {
  id: string;
  email: string;
  locale: string | null;
  status: NewsletterSubscriberStatus;
  unsubscribeToken: string;
  createdAt: string;
  unsubscribedAt: string | null;
};

type NewsletterRow = {
  id: string;
  email: string;
  locale: string | null;
  status: NewsletterSubscriberStatus;
  unsubscribe_token: string;
  created_at: string;
  unsubscribed_at: string | null;
};

function mapRow(row: NewsletterRow): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    locale: row.locale,
    status: row.status === 'unsubscribed' ? 'unsubscribed' : 'active',
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    unsubscribedAt: row.unsubscribed_at,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function subscribeToNewsletter(input: {
  email: string;
  locale?: string | null;
}): Promise<{ subscriber: NewsletterSubscriber; created: boolean }> {
  const email = normalizeEmail(input.email);
  const supabase = getSupabaseAdmin();

  const { data: existing, error: findError } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (existing) {
    const row = existing as NewsletterRow;
    if (row.status === 'active') {
      return { subscriber: mapRow(row), created: false };
    }

    const { data: reactivated, error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        unsubscribed_at: null,
        locale: input.locale ?? row.locale,
        unsubscribe_token: row.unsubscribe_token || nanoid(32),
      })
      .eq('id', row.id)
      .select('*')
      .single();

    if (updateError) throw new Error(updateError.message);
    return { subscriber: mapRow(reactivated as NewsletterRow), created: true };
  }

  const payload = {
    id: nanoid(),
    email,
    locale: input.locale ?? null,
    status: 'active',
    unsubscribe_token: nanoid(32),
    created_at: new Date().toISOString(),
    unsubscribed_at: null,
  };

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return { subscriber: mapRow(data as NewsletterRow), created: true };
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;

  const { data, error } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('unsubscribe_token', trimmed)
    .eq('status', 'active')
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listActiveNewsletterSubscribers(): Promise<
  NewsletterSubscriber[]
> {
  const { data, error } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as NewsletterRow[]).map(mapRow);
}

export async function countNewsletterSubscribers(): Promise<{
  active: number;
  unsubscribed: number;
}> {
  const supabase = getSupabaseAdmin();
  const [active, unsubscribed] = await Promise.all([
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'unsubscribed'),
  ]);

  if (active.error) throw new Error(active.error.message);
  if (unsubscribed.error) throw new Error(unsubscribed.error.message);

  return {
    active: active.count ?? 0,
    unsubscribed: unsubscribed.count ?? 0,
  };
}

export async function listNewsletterSubscribers(limit = 200): Promise<
  NewsletterSubscriber[]
> {
  const { data, error } = await getSupabaseAdmin()
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as NewsletterRow[]).map(mapRow);
}
