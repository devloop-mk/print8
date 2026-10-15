-- Hoodies/sweatshirts are in stock: show the kangaroo-pocket SKU with the new cuts.
insert into public.cms_product_visibility (product_id, active, updated_at)
values
  ('hoodie-basic', true, now()),
  ('hoodie-crewneck', true, now()),
  ('hoodie-quarter-zip', true, now()),
  ('hoodie-full-zip', true, now())
on conflict (product_id) do update
  set active = excluded.active,
      updated_at = excluded.updated_at;
