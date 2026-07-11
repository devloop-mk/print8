import { getSupabaseAdmin } from '@/lib/supabase/client';

export interface CmsContentRecord {
  key: string;
  section: string;
  label: string;
  valueEn: string;
  valueMk: string;
  updatedAt: string;
}

export interface CmsServiceRecord {
  id: string;
  titleEn: string;
  titleMk: string;
  descriptionEn: string;
  descriptionMk: string;
  detailEn: string;
  detailMk: string;
  startingPrice: number;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  updatedAt: string;
}

function isMissingTable(message: string, table: string) {
  const lower = message.toLowerCase();
  return lower.includes(table) || (lower.includes('relation') && lower.includes('does not exist'));
}

export const cmsDb = {
  content: {
    async list(): Promise<CmsContentRecord[]> {
      try {
        const { data, error } = await getSupabaseAdmin()
          .from('cms_content')
          .select('*')
          .order('section')
          .order('key');
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => ({
          key: row.key as string,
          section: row.section as string,
          label: row.label as string,
          valueEn: row.value_en as string,
          valueMk: row.value_mk as string,
          updatedAt: row.updated_at as string,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isMissingTable(message, 'cms_content')) return [];
        throw error;
      }
    },

    async upsert(entry: Omit<CmsContentRecord, 'updatedAt'>) {
      const { data, error } = await getSupabaseAdmin()
        .from('cms_content')
        .upsert({
          key: entry.key,
          section: entry.section,
          label: entry.label,
          value_en: entry.valueEn,
          value_mk: entry.valueMk,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return {
        key: data.key as string,
        section: data.section as string,
        label: data.label as string,
        valueEn: data.value_en as string,
        valueMk: data.value_mk as string,
        updatedAt: data.updated_at as string,
      } satisfies CmsContentRecord;
    },
  },

  services: {
    async list(): Promise<CmsServiceRecord[]> {
      try {
        const { data, error } = await getSupabaseAdmin()
          .from('cms_services')
          .select('*')
          .order('sort_order')
          .order('id');
        if (error) throw new Error(error.message);
        return (data ?? []).map((row) => ({
          id: row.id as string,
          titleEn: row.title_en as string,
          titleMk: row.title_mk as string,
          descriptionEn: row.description_en as string,
          descriptionMk: row.description_mk as string,
          detailEn: row.detail_en as string,
          detailMk: row.detail_mk as string,
          startingPrice: Number(row.starting_price),
          featured: Boolean(row.featured),
          active: Boolean(row.active),
          sortOrder: row.sort_order as number,
          updatedAt: row.updated_at as string,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isMissingTable(message, 'cms_services')) return [];
        throw error;
      }
    },

    async upsert(entry: Omit<CmsServiceRecord, 'updatedAt'>) {
      const { data, error } = await getSupabaseAdmin()
        .from('cms_services')
        .upsert({
          id: entry.id,
          title_en: entry.titleEn,
          title_mk: entry.titleMk,
          description_en: entry.descriptionEn,
          description_mk: entry.descriptionMk,
          detail_en: entry.detailEn,
          detail_mk: entry.detailMk,
          starting_price: entry.startingPrice,
          featured: entry.featured,
          active: entry.active,
          sort_order: entry.sortOrder,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return {
        id: data.id as string,
        titleEn: data.title_en as string,
        titleMk: data.title_mk as string,
        descriptionEn: data.description_en as string,
        descriptionMk: data.description_mk as string,
        detailEn: data.detail_en as string,
        detailMk: data.detail_mk as string,
        startingPrice: Number(data.starting_price),
        featured: Boolean(data.featured),
        active: Boolean(data.active),
        sortOrder: data.sort_order as number,
        updatedAt: data.updated_at as string,
      } satisfies CmsServiceRecord;
    },
  },
};
