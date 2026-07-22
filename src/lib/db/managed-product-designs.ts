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
      const pageSize = 1000;
      const rows: ManagedProductDesignRecord[] = [];
      let from = 0;

      for (;;) {
        let query = getSupabaseAdmin()
          .from('managed_product_designs')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1);

        if (options?.activeOnly) {
          query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const batch = (data as ManagedProductDesignRow[]).map(mapRow);
        rows.push(...batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }

      const search = options?.search?.trim().toLowerCase();
      if (!search) return rows;

      return rows.filter((row) => {
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

  /**
   * Idempotent bulk upsert by id. Preserves existing `active` / `sort_order`
   * when the input omits them. Chunks to stay under PostgREST payload limits.
   */
  async upsertMany(
    inputs: ManagedProductDesignInput[],
    options?: { chunkSize?: number },
  ): Promise<number> {
    if (inputs.length === 0) return 0;

    const existingById = new Map(
      (await this.list()).map((record) => [record.id, record]),
    );
    const now = new Date().toISOString();
    const rows = inputs.map((input) => {
      const existing = existingById.get(input.id);
      return {
        id: input.id,
        template: input.template,
        active: input.active ?? existing?.active ?? true,
        sort_order: input.sortOrder ?? existing?.sortOrder ?? 0,
        created_at: existing?.createdAt ?? now,
        updated_at: now,
      };
    });

    const chunkSize = options?.chunkSize ?? 100;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await getSupabaseAdmin()
        .from('managed_product_designs')
        .upsert(chunk);
      if (error) throw new Error(error.message);
      upserted += chunk.length;
    }
    return upserted;
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
