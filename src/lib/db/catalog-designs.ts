import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { DesignCategory } from '@/lib/data/catalog';

export type DesignAvailability =
  | 'available'
  | 'reserved'
  | 'sold'
  | 'draft'
  | 'archived';

export type CatalogDesignKind = 'fixed' | 'customizable';

export interface CatalogDesignRecord {
  id: string;
  category: DesignCategory;
  kind: CatalogDesignKind;
  image: string;
  tags: string[];
  thumbAspect: number | null;
  exclusive: boolean;
  availability: DesignAvailability;
  reservedOrderId: string | null;
  soldOrderId: string | null;
  price: number | null;
  sortOrder: number;
  nameEn: string;
  nameMk: string;
  descriptionEn: string | null;
  descriptionMk: string | null;
  svgTemplateId: string | null;
  layoutId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CatalogDesignInput = {
  id: string;
  category: DesignCategory;
  kind?: CatalogDesignKind;
  image: string;
  tags?: string[];
  thumbAspect?: number | null;
  exclusive?: boolean;
  availability?: DesignAvailability;
  price?: number | null;
  sortOrder?: number;
  nameEn: string;
  nameMk: string;
  descriptionEn?: string | null;
  descriptionMk?: string | null;
  svgTemplateId?: string | null;
  layoutId?: string | null;
};

type CatalogDesignRow = {
  id: string;
  category: string;
  kind: string;
  image: string;
  tags: unknown;
  thumb_aspect: number | null;
  exclusive: boolean;
  availability: DesignAvailability;
  reserved_order_id: string | null;
  sold_order_id: string | null;
  price: number | null;
  sort_order: number;
  name_en: string;
  name_mk: string;
  description_en: string | null;
  description_mk: string | null;
  svg_template_id: string | null;
  layout_id: string | null;
  created_at: string;
  updated_at: string;
};

function isMissingCatalogDesignsTable(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('catalog_designs') ||
    lower.includes("relation") && lower.includes('does not exist')
  );
}

function mapCatalogDesign(row: CatalogDesignRow): CatalogDesignRecord {
  return {
    id: row.id,
    category: row.category as DesignCategory,
    kind: row.kind as CatalogDesignKind,
    image: row.image,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    thumbAspect: row.thumb_aspect,
    exclusive: row.exclusive,
    availability: row.availability,
    reservedOrderId: row.reserved_order_id,
    soldOrderId: row.sold_order_id,
    price: row.price === null ? null : Number(row.price),
    sortOrder: row.sort_order,
    nameEn: row.name_en,
    nameMk: row.name_mk,
    descriptionEn: row.description_en,
    descriptionMk: row.description_mk,
    svgTemplateId: row.svg_template_id,
    layoutId: row.layout_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInsertRow(input: CatalogDesignInput) {
  const now = new Date().toISOString();
  return {
    id: input.id,
    category: input.category,
    kind: input.kind ?? 'fixed',
    image: input.image,
    tags: input.tags ?? [],
    thumb_aspect: input.thumbAspect ?? null,
    exclusive: input.exclusive ?? false,
    availability: input.availability ?? 'available',
    price: input.price ?? null,
    sort_order: input.sortOrder ?? 0,
    name_en: input.nameEn,
    name_mk: input.nameMk,
    description_en: input.descriptionEn ?? null,
    description_mk: input.descriptionMk ?? null,
    svg_template_id: input.svgTemplateId ?? null,
    layout_id: input.layoutId ?? null,
    created_at: now,
    updated_at: now,
  };
}

export const catalogDesignsDb = {
  async list(options?: {
    category?: DesignCategory | 'all';
    availability?: DesignAvailability | 'all';
    exclusive?: boolean | 'all';
    search?: string;
  }): Promise<CatalogDesignRecord[]> {
    try {
      let query = getSupabaseAdmin()
        .from('catalog_designs')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }
      if (options?.availability && options.availability !== 'all') {
        query = query.eq('availability', options.availability);
      }
      if (options?.exclusive === true) {
        query = query.eq('exclusive', true);
      } else if (options?.exclusive === false) {
        query = query.eq('exclusive', false);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      let rows = (data as CatalogDesignRow[]).map(mapCatalogDesign);
      const search = options?.search?.trim().toLowerCase();
      if (search) {
        rows = rows.filter((row) =>
          [row.id, row.nameEn, row.nameMk, row.category, ...row.tags]
            .join(' ')
            .toLowerCase()
            .includes(search),
        );
      }
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingCatalogDesignsTable(message)) return [];
      throw error;
    }
  },

  async findById(id: string): Promise<CatalogDesignRecord | null> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('catalog_designs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapCatalogDesign(data as CatalogDesignRow) : null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingCatalogDesignsTable(message)) return null;
      throw error;
    }
  },

  async findByIds(ids: string[]): Promise<CatalogDesignRecord[]> {
    if (ids.length === 0) return [];
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('catalog_designs')
        .select('*')
        .in('id', ids);
      if (error) throw new Error(error.message);
      return (data as CatalogDesignRow[]).map(mapCatalogDesign);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingCatalogDesignsTable(message)) return [];
      throw error;
    }
  },

  async upsert(input: CatalogDesignInput): Promise<CatalogDesignRecord> {
    const existing = await this.findById(input.id);
    const row = {
      ...toInsertRow(input),
      created_at: existing?.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reserved_order_id: existing?.reservedOrderId ?? null,
      sold_order_id: existing?.soldOrderId ?? null,
      availability: input.availability ?? existing?.availability ?? 'available',
    };

    const { data, error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .upsert(row)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapCatalogDesign(data as CatalogDesignRow);
  },

  async update(
    id: string,
    patch: Partial<CatalogDesignInput> & {
      availability?: DesignAvailability;
      reservedOrderId?: string | null;
      soldOrderId?: string | null;
    },
  ): Promise<CatalogDesignRecord> {
    const row: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.category !== undefined) row.category = patch.category;
    if (patch.kind !== undefined) row.kind = patch.kind;
    if (patch.image !== undefined) row.image = patch.image;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.thumbAspect !== undefined) row.thumb_aspect = patch.thumbAspect;
    if (patch.exclusive !== undefined) row.exclusive = patch.exclusive;
    if (patch.availability !== undefined) row.availability = patch.availability;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
    if (patch.nameEn !== undefined) row.name_en = patch.nameEn;
    if (patch.nameMk !== undefined) row.name_mk = patch.nameMk;
    if (patch.descriptionEn !== undefined) row.description_en = patch.descriptionEn;
    if (patch.descriptionMk !== undefined) row.description_mk = patch.descriptionMk;
    if (patch.svgTemplateId !== undefined) row.svg_template_id = patch.svgTemplateId;
    if (patch.layoutId !== undefined) row.layout_id = patch.layoutId;
    if (patch.reservedOrderId !== undefined) {
      row.reserved_order_id = patch.reservedOrderId;
    }
    if (patch.soldOrderId !== undefined) row.sold_order_id = patch.soldOrderId;

    const { data, error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapCatalogDesign(data as CatalogDesignRow);
  },

  async delete(id: string) {
    const { error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async reserveForOrder(designId: string, orderId: string) {
    const { data, error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .update({
        availability: 'reserved',
        reserved_order_id: orderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)
      .eq('exclusive', true)
      .eq('availability', 'available')
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(`Design ${designId} is not available for reservation`);
    }
    return mapCatalogDesign(data as CatalogDesignRow);
  },

  async markSold(designId: string, orderId: string) {
    const { data, error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .update({
        availability: 'sold',
        sold_order_id: orderId,
        reserved_order_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)
      .eq('reserved_order_id', orderId)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapCatalogDesign(data as CatalogDesignRow) : null;
  },

  async releaseReservation(designId: string, orderId: string) {
    const { data, error } = await getSupabaseAdmin()
      .from('catalog_designs')
      .update({
        availability: 'available',
        reserved_order_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)
      .eq('reserved_order_id', orderId)
      .select('*')
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapCatalogDesign(data as CatalogDesignRow) : null;
  },
};
