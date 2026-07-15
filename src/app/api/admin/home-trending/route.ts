import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { cmsDb } from '@/lib/db/cms';
import { CMS_HOME_TRENDING_CACHE_TAG } from '@/lib/cms/home-trending';

const entrySchema = z.object({
  designId: z.string().min(1),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
});

const bodySchema = z.object({
  entries: z.array(entrySchema).max(12),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const entries = await cmsDb.homeTrending.list();
  return NextResponse.json({ entries });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid trending entries' }, { status: 400 });
    }

    const entries = await cmsDb.homeTrending.replaceAll(parsed.data.entries);
    revalidateTag(CMS_HOME_TRENDING_CACHE_TAG, 'max');
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save trending designs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
