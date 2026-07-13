import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  deleteAdminDesign,
  getAdminDesign,
  updateAdminDesign,
} from '@/lib/admin/designs';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';

const patchSchema = z.object({
  category: z
    .enum(['business-cards', 'wedding', 'birthday', 'menus', 'general'])
    .optional(),
  kind: z.enum(['fixed', 'customizable']).optional(),
  image: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  thumbAspect: z.number().nullable().optional(),
  exclusive: z.boolean().optional(),
  availability: z
    .enum(['available', 'reserved', 'sold', 'draft', 'archived'])
    .optional(),
  price: z.number().nullable().optional(),
  sortOrder: z.number().optional(),
  nameEn: z.string().min(1).optional(),
  nameMk: z.string().min(1).optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionMk: z.string().nullable().optional(),
  svgTemplateId: z.string().nullable().optional(),
  layoutId: z.string().nullable().optional(),
  reservedOrderId: z.string().nullable().optional(),
  soldOrderId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;
  const design = await getAdminDesign(id);
  if (!design) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json({ design });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid design data' }, { status: 400 });
    }

    const existing = await getAdminDesign(id);
    if (!existing) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    const design = await updateAdminDesign(id, parsed.data);
    revalidateDesignCatalogCache();
    return NextResponse.json({ design });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;

  try {
    await deleteAdminDesign(id);
    revalidateDesignCatalogCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
