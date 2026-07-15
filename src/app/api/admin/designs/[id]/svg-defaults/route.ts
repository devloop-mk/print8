import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  deleteAdminSvgTemplateDefaults,
  resolveAdminDesign,
  saveAdminSvgTemplateDefaults,
} from '@/lib/admin/designs';
import { formatManagedSvgTemplatesError } from '@/lib/db/managed-svg-templates-errors';
import { sanitizeManagedSvgTemplateDefaults } from '@/lib/designs/merge-svg-template-defaults';

const finiteNumber = z.preprocess((value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number());

const transformSchema = z.object({
  dx: finiteNumber,
  dy: finiteNumber,
  scale: finiteNumber,
});

const defaultsSchema = z.object({
  textsEn: z.record(z.string(), z.string()),
  textsMk: z.record(z.string(), z.string()),
  colors: z.record(z.string(), z.string()),
  transforms: z.record(z.string(), transformSchema),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;
  const design = await resolveAdminDesign(id);
  if (!design?.svgTemplate) {
    return NextResponse.json({ error: 'SVG template not found' }, { status: 404 });
  }

  return NextResponse.json({
    templateId: design.svgTemplate.id,
    defaults: design.svgDefaults ?? {
      textsEn: {},
      textsMk: {},
      colors: {},
      transforms: {},
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const rawDefaults = body.defaults ?? body;
    const sanitized = sanitizeManagedSvgTemplateDefaults({
      textsEn: rawDefaults?.textsEn ?? {},
      textsMk: rawDefaults?.textsMk ?? {},
      colors: rawDefaults?.colors ?? {},
      transforms: rawDefaults?.transforms ?? {},
    });
    const parsed = defaultsSchema.safeParse(sanitized);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .slice(0, 3)
        .map((issue) => issue.path.join('.'))
        .join(', ');
      return NextResponse.json(
        {
          error: detail
            ? `Invalid defaults payload (${detail})`
            : 'Invalid defaults payload',
        },
        { status: 400 },
      );
    }

    const design = await resolveAdminDesign(id);
    if (!design?.svgTemplate) {
      return NextResponse.json({ error: 'SVG template not found' }, { status: 404 });
    }

    const saved = await saveAdminSvgTemplateDefaults({
      templateId: design.svgTemplate.id,
      defaults: parsed.data,
    });

    return NextResponse.json({
      defaults: saved.defaults,
      templateId: saved.templateId,
      updatedAt: saved.updatedAt,
      galleryThumbs: saved.galleryThumbs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save defaults';
    return NextResponse.json(
      { error: formatManagedSvgTemplatesError(message) },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const result = await deleteAdminSvgTemplateDefaults(design.svgTemplate.id);
    return NextResponse.json({ ok: true, galleryThumbs: result.galleryThumbs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reset defaults';
    return NextResponse.json(
      { error: formatManagedSvgTemplatesError(message) },
      { status: 500 },
    );
  }
}
