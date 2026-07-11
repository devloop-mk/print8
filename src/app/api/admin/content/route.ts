import { NextRequest, NextResponse } from 'next/server';
import { cmsDb } from '@/lib/db/cms';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { z } from 'zod';

const contentSchema = z.object({
  key: z.string().min(1),
  section: z.string().min(1),
  label: z.string().min(1),
  valueEn: z.string(),
  valueMk: z.string(),
});

const serviceSchema = z.object({
  id: z.string().min(1),
  titleEn: z.string().min(1),
  titleMk: z.string().min(1),
  descriptionEn: z.string(),
  descriptionMk: z.string(),
  detailEn: z.string(),
  detailMk: z.string(),
  startingPrice: z.number(),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const [content, services] = await Promise.all([
    cmsDb.content.list(),
    cmsDb.services.list(),
  ]);

  return NextResponse.json({ content, services });
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();

    if (body.type === 'content') {
      const parsed = contentSchema.safeParse(body.entry);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid content entry' }, { status: 400 });
      }
      const entry = await cmsDb.content.upsert(parsed.data);
      return NextResponse.json({ entry });
    }

    if (body.type === 'service') {
      const parsed = serviceSchema.safeParse(body.entry);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid service entry' }, { status: 400 });
      }
      const entry = await cmsDb.services.upsert(parsed.data);
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: 'Unknown update type' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
