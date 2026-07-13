import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { importStaticDesignToDatabase } from '@/lib/admin/designs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id } = await params;
    const design = await importStaticDesignToDatabase(id);
    return NextResponse.json({ design });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to import design';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
