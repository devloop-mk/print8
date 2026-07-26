-- Auto-create public.customers row when a Supabase Auth user signs up.
-- Run after add-customer-accounts-loyalty.sql

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_normalized text;
  v_name text;
begin
  v_email := trim(coalesce(new.email, ''));
  if v_email = '' then
    return new;
  end if;

  v_normalized := lower(v_email);
  v_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');

  insert into public.customers (
    id,
    email,
    email_normalized,
    full_name,
    points_balance,
    first_order_bonus_granted,
    created_at,
    updated_at
  )
  values (
    new.id,
    v_email,
    v_normalized,
    v_name,
    0,
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    email_normalized = excluded.email_normalized,
    full_name = coalesce(excluded.full_name, public.customers.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();
