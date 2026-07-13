import 'server-only';

import { unstable_cache } from 'next/cache';
import {
  managedSvgTemplatesDb,
  type ManagedSvgTemplateDefaultsPayload,
  type ManagedSvgTemplateRecord,
} from '@/lib/db/managed-svg-templates';

export const MANAGED_SVG_TEMPLATES_CACHE_TAG = 'managed-svg-templates';

export {
  applyManagedSvgTemplateDefaults,
  buildMergedDefaultSvgTemplateState,
  hasManagedSvgDefaults,
} from '@/lib/designs/merge-svg-template-defaults';

const getManagedSvgTemplatesCached = unstable_cache(
  async () => managedSvgTemplatesDb.list(),
  ['managed-svg-templates-v1'],
  {
    revalidate: 300,
    tags: [MANAGED_SVG_TEMPLATES_CACHE_TAG],
  },
);

export async function getManagedSvgTemplateDefaults(
  templateId: string,
): Promise<ManagedSvgTemplateDefaultsPayload | null> {
  const records = await getManagedSvgTemplatesCached();
  const record = records.find((item) => item.templateId === templateId);
  return record?.defaults ?? null;
}

export async function getManagedSvgTemplateDefaultsMap(): Promise<
  Record<string, ManagedSvgTemplateDefaultsPayload>
> {
  try {
    const records = await getManagedSvgTemplatesCached();
    return Object.fromEntries(
      records.map((record) => [record.templateId, record.defaults]),
    );
  } catch {
    return {};
  }
}

export type { ManagedSvgTemplateRecord, ManagedSvgTemplateDefaultsPayload };
