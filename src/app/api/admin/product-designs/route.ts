import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  importStaticProductDesignsToDatabase,
  listAdminProductDesignsPage,
  saveAdminProductDesign,
} from '@/lib/admin/product-designs';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { AdminProductDesignStorage } from '@/lib/admin/product-designs-shared';
import { formatSupabaseError } from '@/lib/supabase/client';

const templateSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['image', 'overlay', 'text']),
  category: z.enum(['image-designs', 'text-designs']),
  productTypes: z.array(z.string()).min(1),
  productIds: z.array(z.string()).optional(),
  nameKey: z.string().min(1),
  defaultSide: z.enum(['front', 'back', 'left', 'right']),
  image: z.string().optional(),
  overlayImage: z.string().optional(),
  overlaySvg: z.string().optional(),
  overlayRecolor: z
    .object({
      primary: z.string(),
      secondary: z.string().optional(),
      slots: z.union([z.literal(1), z.literal(2)]).optional(),
    })
    .optional(),
  overlayColorVariants: z.record(z.string()).optional(),
  overlayScale: z.number().optional(),
  overlayPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  overlayByProductType: z
    .record(
      z.object({
        scale: z.number().optional(),
        position: z.object({ x: z.number(), y: z.number() }).optional(),
      }),
    )
    .optional(),
  designSides: z.array(z.enum(['front', 'back', 'left', 'right'])).optional(),
  backOverlay: z.record(z.unknown()).optional(),
  recommendedColor: z.string().optional(),
  applicableColors: z.array(z.string()).optional(),
  applicableFits: z.array(z.enum(['unisex', 'women', 'kids'])).optional(),
  titleEn: z.string().optional(),
  titleMk: z.string().optional(),
  printMasterImage: z.string().optional(),
  collection: z.string().optional(),
  textStyle: z
    .object({
      text: z.string(),
      textColor: z.string(),
      fontFamily: z.string().optional(),
      fontSize: z.number().optional(),
      fontWeight: z.number().optional(),
      letterSpacing: z.string().optional(),
      lineHeight: z.number().optional(),
      textShadow: z.string().optional(),
      position: z.object({ x: z.number(), y: z.number() }),
      photoPosition: z.object({ x: z.number(), y: z.number() }).optional(),
      photoScale: z.number().optional(),
    })
    .optional(),
});

const createSchema = z.object({
  id: z.string().min(1),
  template: templateSchema,
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const search = params.get('search') ?? undefined;
  const storage = (params.get('storage') ?? 'all') as AdminProductDesignStorage;
  const page = Number.parseInt(params.get('page') ?? '1', 10);

  const result = await listAdminProductDesignsPage({
    search,
    storage,
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
      return NextResponse.json({ error: 'Invalid product design data' }, { status: 400 });
    }

    const design = await saveAdminProductDesign({
      id: parsed.data.id,
      template: parsed.data.template as ProductDesignTemplate,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
    });
    return NextResponse.json({ design }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: formatSupabaseError(err) },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const overwrite = Boolean(body.overwrite);
    const result = await importStaticProductDesignsToDatabase({ overwrite });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: formatSupabaseError(err) },
      { status: 500 },
    );
  }
}
