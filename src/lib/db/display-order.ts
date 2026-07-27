import { getSupabaseAdmin } from '@/lib/supabase/client';

export type DisplayOrderRecord = {
  id: string;
  sortOrder: number;
  updatedAt: string;
};

function isMissingTable(message: string, table: string) {
  const lower = message.toLowerCase();
  return lower.includes(table) || (lower.includes('relation') && lower.includes('does not exist'));
}

async function listOrderTable(
  table:
    | 'cms_product_display_order'
    | 'cms_design_display_order'
    | 'cms_print_design_display_order',
  idColumn: 'product_id' | 'design_id',
): Promise<DisplayOrderRecord[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })
      .order(idColumn, { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row[idColumn] as string,
      sortOrder: row.sort_order as number,
      updatedAt: row.updated_at as string,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isMissingTable(message, table)) return [];
    throw error;
  }
}

async function replaceOrderTable(
  table:
    | 'cms_product_display_order'
    | 'cms_design_display_order'
    | 'cms_print_design_display_order',
  idColumn: 'product_id' | 'design_id',
  entries: Array<{ id: string; sortOrder: number }>,
): Promise<DisplayOrderRecord[]> {
  const admin = getSupabaseAdmin();
  const { error: deleteError } = await admin.from(table).delete().gte('sort_order', -1);
  if (deleteError) throw new Error(deleteError.message);

  if (entries.length === 0) return [];

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from(table)
    .insert(
      entries.map((entry) => ({
        [idColumn]: entry.id,
        sort_order: entry.sortOrder,
        updated_at: now,
      })),
    )
    .select('*');
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row[idColumn] as string,
    sortOrder: row.sort_order as number,
    updatedAt: row.updated_at as string,
  }));
}

async function upsertOrderEntries(
  table:
    | 'cms_product_display_order'
    | 'cms_design_display_order'
    | 'cms_print_design_display_order',
  idColumn: 'product_id' | 'design_id',
  entries: Array<{ id: string; sortOrder: number }>,
): Promise<DisplayOrderRecord[]> {
  if (entries.length === 0) return listOrderTable(table, idColumn);

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin().from(table).upsert(
    entries.map((entry) => ({
      [idColumn]: entry.id,
      sort_order: entry.sortOrder,
      updated_at: now,
    })),
  );
  if (error) throw new Error(error.message);

  return listOrderTable(table, idColumn);
}

export const displayOrderDb = {
  products: {
    list: () => listOrderTable('cms_product_display_order', 'product_id'),
    replaceAll: (entries: Array<{ id: string; sortOrder: number }>) =>
      replaceOrderTable('cms_product_display_order', 'product_id', entries),
  },
  designs: {
    list: () => listOrderTable('cms_design_display_order', 'design_id'),
    /** Upsert only the provided designs so other collections keep their order. */
    upsertMany: (entries: Array<{ id: string; sortOrder: number }>) =>
      upsertOrderEntries('cms_design_display_order', 'design_id', entries),
    replaceAll: (entries: Array<{ id: string; sortOrder: number }>) =>
      replaceOrderTable('cms_design_display_order', 'design_id', entries),
  },
  printDesigns: {
    list: () => listOrderTable('cms_print_design_display_order', 'design_id'),
    /** Upsert only the provided designs so other categories keep their order. */
    upsertMany: (entries: Array<{ id: string; sortOrder: number }>) =>
      upsertOrderEntries('cms_print_design_display_order', 'design_id', entries),
    replaceAll: (entries: Array<{ id: string; sortOrder: number }>) =>
      replaceOrderTable('cms_print_design_display_order', 'design_id', entries),
  },
};

export function toOrderRecord(entries: DisplayOrderRecord[]): Record<string, number> {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.sortOrder]));
}
