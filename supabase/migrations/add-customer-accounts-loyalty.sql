-- Customer accounts (Supabase Auth) + loyalty points ledger
-- Run in Supabase SQL Editor after enabling Email auth in Authentication → Providers.

-- Customer profiles linked to auth.users
create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  email_normalized text not null,
  full_name text,
  phone text,
  default_city text,
  default_address text,
  points_balance integer not null default 0 check (points_balance >= 0),
  first_order_bonus_granted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_normalized_uidx
  on public.customers (email_normalized);

-- Immutable ledger — balance is derived from transactions but cached on customers for reads
create table if not exists public.loyalty_point_transactions (
  id text primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  type text not null check (
    type in ('earn', 'redeem', 'refund', 'bonus', 'adjust', 'clawback')
  ),
  points integer not null check (points <> 0),
  balance_after integer not null check (balance_after >= 0),
  order_id text references public.orders (id) on delete set null,
  note text,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_point_transactions_customer_idx
  on public.loyalty_point_transactions (customer_id, created_at desc);

create index if not exists loyalty_point_transactions_order_idx
  on public.loyalty_point_transactions (order_id);

-- Order loyalty fields
alter table public.orders
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

alter table public.orders
  add column if not exists points_redeemed integer not null default 0 check (points_redeemed >= 0);

alter table public.orders
  add column if not exists points_discount_amount numeric not null default 0 check (
    points_discount_amount >= 0
  );

alter table public.orders
  add column if not exists points_earned integer check (points_earned is null or points_earned >= 0);

alter table public.orders
  add column if not exists points_awarded_at timestamptz;

create index if not exists orders_customer_id_idx on public.orders (customer_id);

-- Atomic balance adjustment (service role only via RPC)
create or replace function public.adjust_customer_points(
  p_transaction_id text,
  p_customer_id uuid,
  p_delta integer,
  p_type text,
  p_order_id text default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns table (transaction_id text, balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_existing_balance integer;
begin
  if p_delta = 0 then
    raise exception 'zero_delta';
  end if;

  if p_idempotency_key is not null then
    select t.id, t.balance_after
    into transaction_id, balance_after
    from public.loyalty_point_transactions t
    where t.idempotency_key = p_idempotency_key;

    if found then
      return next;
      return;
    end if;
  end if;

  select c.points_balance
  into v_balance
  from public.customers c
  where c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer_not_found';
  end if;

  if v_balance + p_delta < 0 then
    raise exception 'insufficient_points';
  end if;

  v_balance := v_balance + p_delta;

  update public.customers
  set
    points_balance = v_balance,
    updated_at = now()
  where id = p_customer_id;

  insert into public.loyalty_point_transactions (
    id,
    customer_id,
    type,
    points,
    balance_after,
    order_id,
    note,
    idempotency_key
  )
  values (
    p_transaction_id,
    p_customer_id,
    p_type,
    p_delta,
    v_balance,
    p_order_id,
    p_note,
    p_idempotency_key
  );

  transaction_id := p_transaction_id;
  balance_after := v_balance;
  return next;
end;
$$;

revoke all on function public.adjust_customer_points from public;
grant execute on function public.adjust_customer_points to service_role;

alter table public.customers enable row level security;
alter table public.loyalty_point_transactions enable row level security;

grant all on table public.customers to postgres, service_role;
grant all on table public.loyalty_point_transactions to postgres, service_role;
grant select, insert, update, delete on table public.customers to service_role;
grant select, insert, update, delete on table public.loyalty_point_transactions to service_role;
