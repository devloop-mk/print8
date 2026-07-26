-- Pending loyalty points: visible immediately after order, spendable after delivery.

alter table public.customers
  add column if not exists points_pending_balance integer not null default 0 check (
    points_pending_balance >= 0
  );

alter table public.orders
  add column if not exists points_first_order_bonus integer not null default 0 check (
    points_first_order_bonus >= 0
  );

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
      'pending_cancel'
    )
  );

create or replace function public.adjust_customer_pending_points(
  p_transaction_id text,
  p_customer_id uuid,
  p_delta integer,
  p_type text,
  p_order_id text default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns table (transaction_id text, pending_balance_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending integer;
begin
  if p_delta = 0 then
    raise exception 'zero_delta';
  end if;

  if p_idempotency_key is not null then
    select t.id, c.points_pending_balance
    into transaction_id, pending_balance_after
    from public.loyalty_point_transactions t
    join public.customers c on c.id = t.customer_id
    where t.idempotency_key = p_idempotency_key;

    if found then
      return next;
      return;
    end if;
  end if;

  select c.points_pending_balance, c.points_balance
  into v_pending, balance_after
  from public.customers c
  where c.id = p_customer_id
  for update;

  if not found then
    raise exception 'customer_not_found';
  end if;

  if v_pending + p_delta < 0 then
    raise exception 'insufficient_pending_points';
  end if;

  v_pending := v_pending + p_delta;

  update public.customers
  set
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
    idempotency_key
  )
  values (
    p_transaction_id,
    p_customer_id,
    p_type,
    p_delta,
    balance_after,
    p_order_id,
    p_note,
    p_idempotency_key
  );

  transaction_id := p_transaction_id;
  pending_balance_after := v_pending;
  return next;
end;
$$;

revoke all on function public.adjust_customer_pending_points from public;
grant execute on function public.adjust_customer_pending_points to service_role;

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
    idempotency_key
  )
  values (
    p_transaction_id,
    p_customer_id,
    'earn',
    p_amount,
    v_balance,
    p_order_id,
    p_note,
    p_idempotency_key
  );

  transaction_id := p_transaction_id;
  balance_after := v_balance;
  pending_balance_after := v_pending;
  return next;
end;
$$;

revoke all on function public.release_customer_pending_points from public;
grant execute on function public.release_customer_pending_points to service_role;
