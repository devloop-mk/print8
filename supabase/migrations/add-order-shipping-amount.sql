alter table public.orders
  add column if not exists shipping_amount numeric not null default 0;

comment on column public.orders.shipping_amount is
  'Cargo delivery fee in MKD (0 for pickup or free-delivery threshold).';
