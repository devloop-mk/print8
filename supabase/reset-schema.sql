-- Reset Print 8 tables to match the app (text IDs, not bigint)
-- Run in Supabase → SQL Editor
-- WARNING: This deletes all orders, uploads, and sessions!

drop table if exists public.uploaded_files cascade;
drop table if exists public.upload_sessions cascade;
drop table if exists public.orders cascade;

-- Upload sessions
create table public.upload_sessions (
  id text primary key,
  token text not null unique,
  expires_at timestamptz not null,
  upload_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index upload_sessions_token_idx on public.upload_sessions (token);

-- Uploaded file metadata
create table public.uploaded_files (
  id text primary key,
  session_id text not null references public.upload_sessions (id) on delete cascade,
  original_name text not null,
  stored_name text not null,
  mime_type text not null,
  size bigint not null,
  created_at timestamptz not null default now()
);

-- Orders
create table public.orders (
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
  created_at timestamptz not null default now()
);
