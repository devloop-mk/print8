import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { listAdminDesignsPage, saveAdminDesign } from '@/lib/admin/designs';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';

const createSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    'business-cards',
    'wedding',
    'birthday',
    'menus',
    'general',
  ]),
  kind: z.enum(['fixed', 'customizable']).optional(),
  image: z.string().min(1),
  tags: z.array(z.string()).optional(),
  thumbAspect: z.number().nullable().optional(),
  exclusive: z.boolean().optional(),
  availability: z
    .enum(['available', 'reserved', 'sold', 'draft', 'archived'])
    .optional(),
  price: z.number().nullable().optional(),
  sortOrder: z.number().optional(),
  nameEn: z.string().min(1),
  nameMk: z.string().min(1),
  descriptionEn: z.string().nullable().optional(),
  descriptionMk: z.string().nullable().optional(),
  svgTemplateId: z.string().nullable().optional(),
  layoutId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const category = params.get('category') ?? 'all';
  const availability = params.get('availability') ?? 'all';
  const exclusive = params.get('exclusive');
  const search = params.get('search') ?? undefined;

  const storage = params.get('storage');
  const page = Number(params.get('page') ?? '1');

  const result = await listAdminDesignsPage({
    category: category as 'all' | 'business-cards',
    search,
    storage:
      storage === 'database' || storage === 'code-only' ? storage : 'all',
    page: Number.isFinite(page) ? page : 1,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid design data' }, { status: 400 });
    }

    const design = await saveAdminDesign(parsed.data);
    revalidateDesignCatalogCache();
    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
