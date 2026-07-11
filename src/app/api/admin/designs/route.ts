import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { listAdminDesigns, saveAdminDesign } from '@/lib/admin/designs';

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

  const designs = await listAdminDesigns({
    category: category as 'all' | 'business-cards',
    availability: availability as 'all' | 'available',
    exclusive:
      exclusive === 'true' ? true : exclusive === 'false' ? false : 'all',
    search,
  });

  return NextResponse.json({ designs });
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
    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
