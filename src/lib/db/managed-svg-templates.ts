import { getSupabaseAdmin } from '@/lib/supabase/client';
import type { SvgTextTransform } from '@/lib/designs/svg-text-transform';

export type ManagedSvgTemplateDefaultsPayload = {
  textsEn: Record<string, string>;
  textsMk: Record<string, string>;
  colors: Record<string, string>;
  transforms: Record<string, SvgTextTransform>;
};

export type ManagedSvgTemplateRecord = {
  templateId: string;
  defaults: ManagedSvgTemplateDefaultsPayload;
  createdAt: string;
  updatedAt: string;
};

export type ManagedSvgTemplateInput = {
  templateId: string;
  defaults: ManagedSvgTemplateDefaultsPayload;
};

type ManagedSvgTemplateRow = {
  template_id: string;
  defaults: unknown;
  created_at: string;
  updated_at: string;
};

const EMPTY_DEFAULTS: ManagedSvgTemplateDefaultsPayload = {
  textsEn: {},
  textsMk: {},
  colors: {},
  transforms: {},
};

function isMissingTable(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('managed_svg_templates') ||
    lower.includes('schema cache') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  );
}

function normalizeDefaults(value: unknown): ManagedSvgTemplateDefaultsPayload {
  if (!value || typeof value !== 'object') return { ...EMPTY_DEFAULTS };

  const record = value as Partial<ManagedSvgTemplateDefaultsPayload>;
  return {
    textsEn:
      record.textsEn && typeof record.textsEn === 'object'
        ? (record.textsEn as Record<string, string>)
        : {},
    textsMk:
      record.textsMk && typeof record.textsMk === 'object'
        ? (record.textsMk as Record<string, string>)
        : {},
    colors:
      record.colors && typeof record.colors === 'object'
        ? (record.colors as Record<string, string>)
        : {},
    transforms:
      record.transforms && typeof record.transforms === 'object'
        ? (record.transforms as Record<string, SvgTextTransform>)
        : {},
  };
}

function mapRow(row: ManagedSvgTemplateRow): ManagedSvgTemplateRecord {
  return {
    templateId: row.template_id,
    defaults: normalizeDefaults(row.defaults),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const managedSvgTemplatesDb = {
  async list(): Promise<ManagedSvgTemplateRecord[]> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('managed_svg_templates')
        .select('*')
        .order('template_id', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as ManagedSvgTemplateRow[]).map(mapRow);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTable(message)) return [];
      throw error;
    }
  },

  async findByTemplateId(
    templateId: string,
  ): Promise<ManagedSvgTemplateRecord | null> {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('managed_svg_templates')
        .select('*')
        .eq('template_id', templateId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? mapRow(data as ManagedSvgTemplateRow) : null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingTable(message)) return null;
      throw error;
    }
  },

  async upsert(input: ManagedSvgTemplateInput): Promise<ManagedSvgTemplateRecord> {
    const now = new Date().toISOString();
    const existing = await this.findByTemplateId(input.templateId);

    const row = {
      template_id: input.templateId,
      defaults: normalizeDefaults(input.defaults),
      created_at: existing?.createdAt ?? now,
      updated_at: now,
    };

    const { data, error } = await getSupabaseAdmin()
      .from('managed_svg_templates')
      .upsert(row)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapRow(data as ManagedSvgTemplateRow);
  },

  async delete(templateId: string) {
    const { error } = await getSupabaseAdmin()
      .from('managed_svg_templates')
      .delete()
      .eq('template_id', templateId);

    if (error) throw new Error(error.message);
  },
};
