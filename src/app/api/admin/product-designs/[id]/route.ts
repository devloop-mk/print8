import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  deleteAdminProductDesign,
  resolveAdminProductDesign,
  saveAdminProductDesign,
} from '@/lib/admin/product-designs';
import type { ProductDesignTemplate } from '@/lib/data/catalog';

const patchSchema = z.object({
  template: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await context.params;
  const design = await resolveAdminProductDesign(id);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json({ design });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await context.params;

  try {
    const existing = await resolveAdminProductDesign(id);
    if (!existing) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
    }

    const template = parsed.data.template
      ? ({ ...existing.template, ...parsed.data.template } as ProductDesignTemplate)
      : existing.template;

    const design = await saveAdminProductDesign({
      id,
      template,
      active: parsed.data.active ?? existing.active,
      sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    });

    return NextResponse.json({ design });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to update product design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await context.params;

  try {
    await deleteAdminProductDesign(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to delete product design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
