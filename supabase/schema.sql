-- Print 8 — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
--
-- If you already created tables with wrong types (bigint IDs), run
-- supabase/reset-schema.sql instead (drops and recreates tables).

-- Upload sessions (for secure file uploads)
create table if not exists public.upload_sessions (
  id text primary key,
  token text not null unique,
  expires_at timestamptz not null,
  upload_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists upload_sessions_token_idx on public.upload_sessions (token);

-- Uploaded file metadata
create table if not exists public.uploaded_files (
  id text primary key,
  session_id text not null references public.upload_sessions (id) on delete cascade,
  original_name text not null,
  stored_name text not null,
  original_stored_name text,
  mime_type text not null,
  size bigint not null,
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  status text not null default 'pending',
  payment_method text not null default 'cod',
  locale text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_city text not null,
  customer_address text not null,
  notes text,
  items jsonb not null default '[]'::jsonb,
  file_ids jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  fulfillment_method text not null default 'cargo',
  coupon_code text,
  discount_amount numeric not null default 0,
  subtotal_amount numeric,
  created_at timestamptz not null default now()
);

-- Anonymous page view analytics (admin dashboard)
create table if not exists public.page_views (
  id text primary key,
  path text not null,
  locale text,
  visitor_id text not null,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_visitor_id_idx on public.page_views (visitor_id);

-- Contact messages from the public contact form (admin inbox)
create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  message text not null,
  locale text,
  status text not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

grant all on table public.contact_messages to postgres, service_role;
grant select, insert, update, delete on table public.contact_messages to service_role;

-- Newsletter subscribers (opt-in list for admin broadcasts)
create table if not exists public.newsletter_subscribers (
  id text primary key,
  email text not null,
  locale text,
  status text not null default 'active',
  unsubscribe_token text not null unique,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

grant all on table public.newsletter_subscribers to postgres, service_role;
grant select, insert, update, delete on table public.newsletter_subscribers to service_role;

-- Admin-managed merch / product designs (overrides static catalog + new designs)
create table if not exists public.managed_product_designs (
  id text primary key,
  template jsonb not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists managed_product_designs_active_idx
  on public.managed_product_designs (active);

create index if not exists managed_product_designs_sort_idx
  on public.managed_product_designs (sort_order);

grant all on table public.managed_product_designs to postgres, service_role;
grant select, insert, update, delete on table public.managed_product_designs to service_role;

-- Coupons (public codes + reward codes) — see migrations/add-coupons.sql for full seed
create table if not exists public.coupons (
  id text primary key,
  code text not null,
  kind text not null default 'public',
  discount_amount numeric not null check (discount_amount > 0),
  min_order_amount numeric not null default 0 check (min_order_amount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions_per_day integer,
  max_redemptions_total integer,
  active boolean not null default true,
  issued_to_email text,
  issued_from_order_id text,
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists coupons_code_unique_idx on public.coupons (lower(code));

create table if not exists public.coupon_redemptions (
  id text primary key,
  coupon_id text not null references public.coupons (id),
  order_id text not null references public.orders (id) on delete cascade,
  order_number text not null,
  discount_amount numeric not null,
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now()
);

create unique index if not exists coupon_redemptions_order_id_idx
  on public.coupon_redemptions (order_id);

create table if not exists public.coupon_reward_tiers (
  id text primary key,
  min_spend numeric not null,
  reward_amount numeric not null,
  reward_min_order_amount numeric not null default 0,
  reward_valid_days integer not null default 30,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

grant all on table public.coupons to postgres, service_role;
grant all on table public.coupon_redemptions to postgres, service_role;
grant all on table public.coupon_reward_tiers to postgres, service_role;

-- Spin wheel plays — see migrations/add-spin-wheel.sql
create table if not exists public.spin_plays (
  id text primary key,
  email text not null,
  email_normalized text not null,
  prize_key text not null,
  discount_amount integer not null default 0,
  coupon_id text references public.coupons (id) on delete set null,
  coupon_code text,
  ip_hash text,
  user_agent_hash text,
  locale text,
  created_at timestamptz not null default now()
);

create unique index if not exists spin_plays_email_normalized_uidx
  on public.spin_plays (email_normalized);

create index if not exists spin_plays_created_at_idx
  on public.spin_plays (created_at desc);

grant all on table public.spin_plays to postgres, service_role;

-- Storage bucket (create in Dashboard → Storage → New bucket)
-- Name: uploads
-- Public: OFF (private bucket — served via API with service role)
-- Then run the policies below if needed:

-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false)
-- on conflict (id) do nothing;
