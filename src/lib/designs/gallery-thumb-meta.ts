import fs from 'node:fs';
import path from 'node:path';
import { designTemplates } from '@/lib/data/catalog';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import { getDesignGalleryThumbPath } from '@/lib/designs/design-thumb';
import { hasManagedSvgDefaults } from '@/lib/designs/merge-svg-template-defaults';

const PUBLIC_ROOT = path.join(process.cwd(), 'public');

export type GalleryThumbMeta = {
  templateId: string;
  designId: string;
  defaultsUpdatedAt: string | null;
  builtAt: string;
};

export function findDesignIdsForSvgTemplateId(templateId: string): string[] {
  return designTemplates
    .filter((design) => design.svgTemplateId === templateId)
    .map((design) => design.id);
}

function galleryThumbMetaPath(thumbPath: string) {
  return `${thumbPath}.meta.json`;
}

export function readGalleryThumbMeta(thumbPath: string): GalleryThumbMeta | null {
  const metaPath = galleryThumbMetaPath(thumbPath);
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8')) as GalleryThumbMeta;
  } catch {
    return null;
  }
}

export function writeGalleryThumbMeta(thumbPath: string, meta: GalleryThumbMeta) {
  fs.writeFileSync(galleryThumbMetaPath(thumbPath), JSON.stringify(meta));
}

export function isGalleryThumbFreshForTemplate(
  templateId: string,
  updatedAt: string,
  managedDefaults?: ManagedSvgTemplateDefaultsPayload | null,
): boolean {
  const designIds = findDesignIdsForSvgTemplateId(templateId);
  if (designIds.length === 0) return false;

  const needsManagedMeta = hasManagedSvgDefaults(managedDefaults);

  return designIds.every((designId) => {
    const thumbPath = path.join(
      PUBLIC_ROOT,
      getDesignGalleryThumbPath(designId).replace(/^\//, ''),
    );
    if (!fs.existsSync(thumbPath)) return false;

    if (!needsManagedMeta) {
      return true;
    }

    const meta = readGalleryThumbMeta(thumbPath);
    return meta?.defaultsUpdatedAt === updatedAt;
  });
}
