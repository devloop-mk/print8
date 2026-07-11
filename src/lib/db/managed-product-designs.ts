import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { ProductDesignTemplate } from '@/lib/data/catalog';

export type ManagedProductDesignRecord = {
  id: string;
  template: ProductDesignTemplate;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ManagedProductDesignInput = {
  id: string;
  template: ProductDesignTemplate;
  active?: boolean;
  sortOrder?: number;
};

type ManagedProductDesignRow = {
  id: string;
  template: unknown;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function isMissingTable(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('managed_product_designs') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  );
}

function mapRow(row: ManagedProductDesignRow): ManagedProductDesignRecord {
  return {
    id: row.id,
    template: row.template as ProductDesignTemplate,
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const managedProductDesignsDb = {
  async list(options?: {
    activeOnly?: boolean;
    search?: string;
  }): Promise<ManagedProductDesignRecord[]> {
    try {
      let query = getSupabaseAdmin()
        .from('managed_product_designs')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (options?.activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let rows = (data as ManagedProductDesignRow[]).map(mapRow);
      const search = options?.search?.trim().toLowerCase();
      if (search) {
        rows = rows.filter((row) => {
          const tpl = row.template;
          return [
            row.id,
            tpl.nameKey,
            tpl.titleEn,
            tpl.titleMk,
            tpl.collection,
            ...(tpl.productTypes ?? []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search);
        });
      }
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTable(message)) return [];
      throw error;
    }
  },

  async findById(id: string): Promise<ManagedProductDesignRecord | null> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('managed_product_designs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapRow(data as ManagedProductDesignRow) : null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTable(message)) return null;
      throw error;
    }
  },

  async upsert(input: ManagedProductDesignInput): Promise<ManagedProductDesignRecord> {
    const existing = await this.findById(input.id);
    const now = new Date().toISOString();
    const row = {
      id: input.id,
      template: input.template,
      active: input.active ?? existing?.active ?? true,
      sort_order: input.sortOrder ?? existing?.sortOrder ?? 0,
      created_at: existing?.createdAt ?? now,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from('managed_product_designs')
      .upsert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as ManagedProductDesignRow);
  },

  async update(
    id: string,
    patch: Partial<ManagedProductDesignInput>,
  ): Promise<ManagedProductDesignRecord> {
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.template !== undefined) row.template = patch.template;
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;

    const { data, error } = await getSupabaseAdmin()
      .from('managed_product_designs')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data as ManagedProductDesignRow);
  },

  async delete(id: string) {
    const { error } = await getSupabaseAdmin()
      .from('managed_product_designs')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
