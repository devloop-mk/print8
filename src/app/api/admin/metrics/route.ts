import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getAdminMetrics } from '@/lib/admin/orders';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const metrics = await getAdminMetrics();
  return NextResponse.json({ metrics });
}
