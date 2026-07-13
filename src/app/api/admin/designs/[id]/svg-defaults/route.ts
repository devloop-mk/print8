import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  deleteAdminSvgTemplateDefaults,
  resolveAdminDesign,
  saveAdminSvgTemplateDefaults,
} from '@/lib/admin/designs';
import { formatManagedSvgTemplatesError } from '@/lib/db/managed-svg-templates-errors';

const transformSchema = z.object({
  dx: z.number(),
  dy: z.number(),
  scale: z.number(),
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
    const parsed = defaultsSchema.safeParse(body.defaults ?? body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid defaults payload' }, { status: 400 });
    }

    const design = await resolveAdminDesign(id);
    if (!design?.svgTemplate) {
      return NextResponse.json({ error: 'SVG template not found' }, { status: 404 });
    }

    const saved = await saveAdminSvgTemplateDefaults({
      templateId: design.svgTemplate.id,
      defaults: parsed.data,
    });

    return NextResponse.json({ defaults: saved.defaults, templateId: saved.templateId });
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

    await deleteAdminSvgTemplateDefaults(design.svgTemplate.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reset defaults';
    return NextResponse.json(
      { error: formatManagedSvgTemplatesError(message) },
      { status: 500 },
    );
  }
}
