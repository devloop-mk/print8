import { getSupabaseAdmin } from '@/lib/supabase/client';

export type ProductVisibilityRecord = {
  productId: string;
  active: boolean;
  updatedAt: string;
};

function isMissingTable(message: string, table: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes(table) ||
    (lower.includes('relation') && lower.includes('does not exist'))
  );
}

export const productVisibilityDb = {
  async list(): Promise<ProductVisibilityRecord[]> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('cms_product_visibility')
        .select('*')
        .order('product_id');
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        productId: row.product_id as string,
        active: Boolean(row.active),
        updatedAt: row.updated_at as string,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTable(message, 'cms_product_visibility')) return [];
      throw error;
    }
  },

  async upsert(entry: Pick<ProductVisibilityRecord, 'productId' | 'active'>) {
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from('cms_product_visibility')
      .upsert({
        product_id: entry.productId,
        active: entry.active,
        updated_at: now,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return {
      productId: data.product_id as string,
      active: Boolean(data.active),
      updatedAt: data.updated_at as string,
    } satisfies ProductVisibilityRecord;
  },
};
