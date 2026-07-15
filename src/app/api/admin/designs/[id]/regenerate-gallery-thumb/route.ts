import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { resolveAdminDesign } from '@/lib/admin/designs';
import { formatGalleryThumbBuilderError } from '@/lib/db/managed-svg-templates-errors';
import { managedSvgTemplatesDb } from '@/lib/db/managed-svg-templates';
import {
  GALLERY_THUMB_REGEN_LOCAL_HINT_MK,
  isGalleryThumbRegenAvailable,
} from '@/lib/designs/gallery-thumb-local';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id } = await params;
    const design = await resolveAdminDesign(id);
    if (!design?.svgTemplate) {
      return NextResponse.json({ error: 'SVG template not found' }, { status: 404 });
    }

    if (!isGalleryThumbRegenAvailable()) {
      return NextResponse.json(
        { error: GALLERY_THUMB_REGEN_LOCAL_HINT_MK },
        { status: 501 },
      );
    }

    const { regenerateGalleryThumbsForTemplate } = await import(
      '@/lib/designs/gallery-thumb-builder.core'
    );
    const managed = await managedSvgTemplatesDb.findByTemplateId(design.svgTemplate.id);
    const galleryThumbs = await regenerateGalleryThumbsForTemplate(
      design.svgTemplate.id,
      managed?.defaults ?? null,
      managed?.updatedAt ?? null,
    );

    if (galleryThumbs.length === 0) {
      return NextResponse.json(
        {
          error:
            'Не се генерира gallery WebP. Проверете дали Playwright е инсталиран: npm run playwright:install',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ galleryThumbs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate gallery thumb';
    return NextResponse.json(
      { error: formatGalleryThumbBuilderError(message) },
      { status: 500 },
    );
  }
}
