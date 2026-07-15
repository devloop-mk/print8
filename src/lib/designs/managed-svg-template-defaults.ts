import 'server-only';

import { unstable_cache } from 'next/cache';
import {
  managedSvgTemplatesDb,
  type ManagedSvgTemplateDefaultsPayload,
  type ManagedSvgTemplateRecord,
} from '@/lib/db/managed-svg-templates';
import { isGalleryThumbFreshForTemplate } from '@/lib/designs/gallery-thumb-meta.server';
import { hasManagedSvgDefaults } from '@/lib/designs/merge-svg-template-defaults';

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

export async function getManagedSvgTemplateVersionMap(): Promise<
  Record<string, string>
> {
  try {
    const records = await getManagedSvgTemplatesCached();
    const result: Record<string, string> = {};
    for (const record of records) {
      if (!hasManagedSvgDefaults(record.defaults)) continue;
      if (
        !isGalleryThumbFreshForTemplate(
          record.templateId,
          record.updatedAt,
          record.defaults,
        )
      ) {
        continue;
      }
      result[record.templateId] = record.updatedAt;
    }
    return result;
  } catch {
    return {};
  }
}

export async function getManagedSvgTemplatePublicMap(): Promise<
  Record<string, { defaults: ManagedSvgTemplateDefaultsPayload; updatedAt: string }>
> {
  try {
    const records = await getManagedSvgTemplatesCached();
    return Object.fromEntries(
      records.map((record) => {
        const includeVersion =
          !hasManagedSvgDefaults(record.defaults) ||
          isGalleryThumbFreshForTemplate(
            record.templateId,
            record.updatedAt,
            record.defaults,
          );
        return [
          record.templateId,
          {
            defaults: record.defaults,
            updatedAt: includeVersion ? record.updatedAt : '',
          },
        ];
      }),
    );
  } catch {
    return {};
  }
}

export type { ManagedSvgTemplateRecord, ManagedSvgTemplateDefaultsPayload };
