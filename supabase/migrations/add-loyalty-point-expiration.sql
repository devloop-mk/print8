-- Loyalty point lots (FIFO spend + 6-month expiry) and 1 pt = 1 MKD redemption support.
-- Run after add-loyalty-pending-points.sql.

create table if not exists public.loyalty_point_lots (
  id text primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  points_remaining integer not null check (points_remaining >= 0),
  expires_at timestamptz not null,
  source_transaction_id text references public.loyalty_point_transactions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_point_lots_customer_expires_idx
  on public.loyalty_point_lots (customer_id, expires_at);

alter table public.loyalty_point_transactions
  add column if not exists expires_at timestamptz;

alter table public.loyalty_point_transactions
  drop constraint if exists loyalty_point_transactions_type_check;

alter table public.loyalty_point_transactions
  add constraint loyalty_point_transactions_type_check check (
    type in (
      'earn',
      'redeem',
      'refund',
      'bonus',
      'adjust',
      'clawback',
      'pending_earn',
      'pending_cancel',
      'expire'
    )
  );

-- Backfill one lot per customer from current ready balance (6 months from migration).
insert into public.loyalty_point_lots (id, customer_id, points_remaining, expires_at)
select
  'backfill:' || c.id,
  c.id,
  c.points_balance,
  now() + interval '6 months'
from public.customers c
where c.points_balance > 0
  and not exists (
    select 1
    from public.loyalty_point_lots l
    where l.customer_id = c.id
  );

create or replace function public._loyalty_points_expires_at()
returns timestamptz
language sql
stable
as $$
  select now() + interval '6 months';
$$;

create or replace function public._expire_loyalty_point_lots_for_customer(
  p_customer_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_total integer;
  v_balance integer;
  v_transaction_id text;
begin
  select coalesce(sum(l.points_remaining), 0)
  into v_expired_total
  from public.loyalty_point_lots l
  where l.customer_id = p_customer_id
    and l.expires_at <= now()
    and l.points_remaining > 0;

  if v_expired_total <= 0 then
    return 0;
  end if;

  select c.points_balance
  into v_balance
  from public.customers c
  where c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer_not_found';
  end if;

  update public.loyalty_point_lots l
  set points_remaining = 0
  where l.customer_id = p_customer_id
    and l.expires_at <= now()
    and l.points_remaining > 0;

  v_balance := greatest(0, v_balance - v_expired_total);

  update public.customers
  set
    points_balance = v_balance,
    updated_at = now()
  where id = p_customer_id;

  v_transaction_id := 'expire:' || p_customer_id || ':' || floor(extract(epoch from now()))::text;

  insert into public.loyalty_point_transactions (
    id,
    customer_id,
    type,
    points,
    balance_after,
    note
  )
  values (
    v_transaction_id,
    p_customer_id,
    'expire',
    -v_expired_total,
    v_balance,
    'Points expired after 6 months'
  );

  return v_expired_total;
end;
$$;

create or replace function public._create_loyalty_point_lot(
  p_customer_id uuid,
  p_points integer,
  p_source_transaction_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_points <= 0 then
    return;
  end if;

  insert into public.loyalty_point_lots (
    id,
    customer_id,
    points_remaining,
    expires_at,
    source_transaction_id
  )
  values (
    'lot:' || p_source_transaction_id,
    p_customer_id,
    p_points,
    public._loyalty_points_expires_at(),
    p_source_transaction_id
  );
end;
$$;

create or replace function public._consume_loyalty_point_lots(
  p_customer_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer := p_points;
  v_lot record;
  v_available integer;
begin
  if p_points <= 0 then
    return;
  end if;

  perform public._expire_loyalty_point_lots_for_customer(p_customer_id);

  for v_lot in
    select l.id, l.points_remaining
    from public.loyalty_point_lots l
    where l.customer_id = p_customer_id
      and l.points_remaining > 0
      and l.expires_at > now()
    order by l.expires_at asc, l.created_at asc
    for update
  loop
    if v_remaining <= 0 then
      exit;
    end if;

    v_available := least(v_lot.points_remaining, v_remaining);

    update public.loyalty_point_lots
    set points_remaining = points_remaining - v_available
    where id = v_lot.id;

    v_remaining := v_remaining - v_available;
  end loop;

  if v_remaining > 0 then
    raise exception 'insufficient_points';
  end if;
end;
$$;

create or replace function public.expire_loyalty_point_lots_for_customer(
  p_customer_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return public._expire_loyalty_point_lots_for_customer(p_customer_id);
end;
$$;

revoke all on function public.expire_loyalty_point_lots_for_customer from public;
grant execute on function public.expire_loyalty_point_lots_for_customer to service_role;

create or replace function public.expire_loyalty_point_lots_all()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_total integer := 0;
  v_expired integer;
begin
  for v_customer_id in
    select distinct l.customer_id
    from public.loyalty_point_lots l
    where l.points_remaining > 0
      and l.expires_at <= now()
  loop
    v_expired := public._expire_loyalty_point_lots_for_customer(v_customer_id);
    v_total := v_total + v_expired;
  end loop;

  return v_total;
end;
$$;

revoke all on function public.expire_loyalty_point_lots_all from public;
grant execute on function public.expire_loyalty_point_lots_all to service_role;

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
  v_expires_at timestamptz;
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

  if p_delta < 0 then
    perform public._consume_loyalty_point_lots(p_customer_id, abs(p_delta));
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
  v_expires_at := case
    when p_delta > 0 and p_type in ('earn', 'bonus', 'refund', 'adjust') then public._loyalty_points_expires_at()
    else null
  end;

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
    idempotency_key,
    expires_at
  )
  values (
    p_transaction_id,
    p_customer_id,
    p_type,
    p_delta,
    v_balance,
    p_order_id,
    p_note,
    p_idempotency_key,
    v_expires_at
  );

  if p_delta > 0 and p_type in ('earn', 'bonus', 'refund', 'adjust') then
    perform public._create_loyalty_point_lot(
      p_customer_id,
      p_delta,
      p_transaction_id
    );
  end if;

  transaction_id := p_transaction_id;
  balance_after := v_balance;
  return next;
end;
$$;

create or replace function public.release_customer_pending_points(
  p_transaction_id text,
  p_customer_id uuid,
  p_amount integer,
  p_order_id text default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns table (transaction_id text, balance_after integer, pending_balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_pending integer;
  v_expires_at timestamptz;
begin
  if p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if p_idempotency_key is not null then
    select t.id, t.balance_after, c.points_pending_balance
    into transaction_id, balance_after, pending_balance_after
    from public.loyalty_point_transactions t
    join public.customers c on c.id = t.customer_id
    where t.idempotency_key = p_idempotency_key;

    if found then
      return next;
      return;
    end if;
  end if;

  select c.points_balance, c.points_pending_balance
  into v_balance, v_pending
  from public.customers c
  where c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer_not_found';
  end if;

  if v_pending < p_amount then
    raise exception 'insufficient_pending_points';
  end if;

  v_pending := v_pending - p_amount;
  v_balance := v_balance + p_amount;
  v_expires_at := public._loyalty_points_expires_at();

  update public.customers
  set
    points_balance = v_balance,
    points_pending_balance = v_pending,
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
    idempotency_key,
    expires_at
  )
  values (
    p_transaction_id,
    p_customer_id,
    'earn',
    p_amount,
    v_balance,
    p_order_id,
    p_note,
    p_idempotency_key,
    v_expires_at
  );

  perform public._create_loyalty_point_lot(
    p_customer_id,
    p_amount,
    p_transaction_id
  );

  transaction_id := p_transaction_id;
  balance_after := v_balance;
  pending_balance_after := v_pending;
  return next;
end;
$$;

grant all on table public.loyalty_point_lots to postgres, service_role;
grant select, insert, update, delete on table public.loyalty_point_lots to service_role;
